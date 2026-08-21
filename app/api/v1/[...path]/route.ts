import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  backendApiBase,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth/session-cookies"

export const runtime = "nodejs"

type RouteCtx = { params: Promise<{ path: string[] }> }

async function tryRefresh(refresh: string): Promise<{
  access: string
  refresh: string
} | null> {
  const base = backendApiBase()
  if (!base) return null
  const res = await fetch(`${base}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
    cache: "no-store",
  })
  if (!res.ok) return null
  const data = (await res.json()) as {
    tokens: { access_token: string; refresh_token: string }
  }
  return {
    access: data.tokens.access_token,
    refresh: data.tokens.refresh_token,
  }
}

async function proxy(request: NextRequest, ctx: RouteCtx): Promise<NextResponse> {
  const base = backendApiBase()
  if (!base) {
    return NextResponse.json({ detail: "API não configurada" }, { status: 500 })
  }

  const { path } = await ctx.params
  const suffix = path.join("/")
  const search = request.nextUrl.search
  const target = `${base}/api/v1/${suffix}${search}`

  const jar = await cookies()
  let access = jar.get(ACCESS_COOKIE)?.value ?? null
  const refresh = jar.get(REFRESH_COOKIE)?.value ?? null

  const headers = new Headers()
  const accept = request.headers.get("Accept")
  const contentType = request.headers.get("Content-Type")
  if (accept) headers.set("Accept", accept)
  else headers.set("Accept", "application/json")
  if (contentType) headers.set("Content-Type", contentType)

  const method = request.method.toUpperCase()
  const hasBody = !["GET", "HEAD"].includes(method)
  const body = hasBody ? await request.arrayBuffer() : undefined

  async function forward(token: string | null): Promise<Response> {
    const h = new Headers(headers)
    if (token) h.set("Authorization", `Bearer ${token}`)
    return fetch(target, {
      method,
      headers: h,
      body: body && body.byteLength > 0 ? body : undefined,
      cache: "no-store",
    })
  }

  let upstream = await forward(access)

  // Uma tentativa de refresh se access expirou.
  if (upstream.status === 401 && refresh) {
    const rotated = await tryRefresh(refresh)
    if (rotated) {
      access = rotated.access
      upstream = await forward(access)
      const out = new NextResponse(upstream.body, {
        status: upstream.status,
        headers: filterResponseHeaders(upstream.headers),
      })
      setAuthCookies(out, rotated.access, rotated.refresh)
      return out
    }
    const out = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: filterResponseHeaders(upstream.headers),
    })
    clearAuthCookies(out)
    return out
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: filterResponseHeaders(upstream.headers),
  })
}

function filterResponseHeaders(src: Headers): Headers {
  const out = new Headers()
  const pass = ["content-type", "content-disposition", "cache-control"]
  for (const key of pass) {
    const v = src.get(key)
    if (v) out.set(key, v)
  }
  return out
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
