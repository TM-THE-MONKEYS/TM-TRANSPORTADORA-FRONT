import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  backendApiBase,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth/session-cookies"
import { normalizeAuthUser } from "@/lib/api/adapters/auth"
import { shouldUseMocks } from "@/lib/api/config"
import { mockMe } from "@/lib/mocks/auth"

export async function GET() {
  const jar = await cookies()
  const access = jar.get(ACCESS_COOKIE)?.value
  if (!access) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  if (shouldUseMocks()) {
    try {
      const user = await mockMe(access)
      return NextResponse.json(normalizeAuthUser(user))
    } catch {
      const out = NextResponse.json({ error: "Sessão inválida" }, { status: 401 })
      clearAuthCookies(out)
      return out
    }
  }

  const base = backendApiBase()
  if (!base) {
    return NextResponse.json({ error: "API não configurada" }, { status: 500 })
  }

  let res: Response
  try {
    res = await fetch(`${base}/api/v1/auth/me`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${access}` },
      cache: "no-store",
    })
  } catch {
    return NextResponse.json(
      { error: "API local indisponível. Verifique o backend ou ative mocks." },
      { status: 503 },
    )
  }

  if (!res.ok) {
    const out = NextResponse.json({ error: "Sessão inválida" }, { status: 401 })
    if (res.status === 401) clearAuthCookies(out)
    return out
  }

  const raw = await res.json()
  return NextResponse.json(normalizeAuthUser(raw))
}

/** Rotaciona access via refresh httpOnly. */
export async function POST() {
  const jar = await cookies()
  const refresh = jar.get(REFRESH_COOKIE)?.value
  if (!refresh) {
    const out = NextResponse.json({ error: "Sessão expirada" }, { status: 401 })
    clearAuthCookies(out)
    return out
  }

  if (shouldUseMocks()) {
    try {
      const access = jar.get(ACCESS_COOKIE)?.value ?? refresh.replace("mock-refresh-", "mock-access-")
      const user = await mockMe(access)
      const out = NextResponse.json({ user: normalizeAuthUser(user) })
      setAuthCookies(out, access, refresh)
      return out
    } catch {
      const out = NextResponse.json({ error: "Sessão expirada" }, { status: 401 })
      clearAuthCookies(out)
      return out
    }
  }

  const base = backendApiBase()
  if (!base) {
    return NextResponse.json({ error: "API não configurada" }, { status: 500 })
  }

  const res = await fetch(`${base}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
    cache: "no-store",
  })

  if (!res.ok) {
    const out = NextResponse.json({ error: "Sessão expirada" }, { status: 401 })
    clearAuthCookies(out)
    return out
  }

  const data = (await res.json()) as {
    tokens: { access_token: string; refresh_token: string }
    user: Record<string, unknown>
  }
  const out = NextResponse.json({ user: normalizeAuthUser(data.user as never) })
  setAuthCookies(out, data.tokens.access_token, data.tokens.refresh_token)
  return out
}
