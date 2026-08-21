import { NextResponse } from "next/server"
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/session-cookies"
import { isAccessTokenValid } from "@/lib/security/validate-session-token"

/**
 * Compat: ainda aceita POST com access_token (ex.: fluxos legados).
 * Preferir /api/auth/login e /api/auth/register que já setam cookies.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    access_token?: string
    refresh_token?: string | null
  }
  if (!body.access_token) {
    return NextResponse.json({ error: "Token obrigatório" }, { status: 400 })
  }

  if (!(await isAccessTokenValid(body.access_token))) {
    return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  setAuthCookies(res, body.access_token, body.refresh_token ?? null)
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  clearAuthCookies(res)
  return res
}
