import { NextResponse } from "next/server"
import { backendApiBase, setAuthCookies } from "@/lib/auth/session-cookies"
import { normalizeAuthUser } from "@/lib/api/adapters/auth"

type RegisterBody = {
  tenant_name: string
  document?: string
  admin_name: string
  email: string
  password: string
}

/** Registro de tenant: tokens só em cookies httpOnly. */
export async function POST(request: Request) {
  const body = (await request.json()) as RegisterBody
  const base = backendApiBase()
  if (!base) {
    return NextResponse.json({ error: "API não configurada" }, { status: 500 })
  }

  const res = await fetch(`${base}/api/v1/auth/register-tenant`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  const json = (await res.json().catch(() => ({}))) as {
    tokens?: { access_token: string; refresh_token: string }
    user?: Record<string, unknown>
    detail?: unknown
  }

  if (!res.ok || !json.tokens || !json.user) {
    const detail =
      typeof json.detail === "string"
        ? json.detail
        : "Não foi possível criar a conta"
    return NextResponse.json({ error: detail }, { status: res.status || 400 })
  }

  const user = normalizeAuthUser(json.user as never)
  const out = NextResponse.json({ user })
  setAuthCookies(out, json.tokens.access_token, json.tokens.refresh_token)
  return out
}
