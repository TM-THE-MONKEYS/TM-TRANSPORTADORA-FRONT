import { NextResponse } from "next/server"
import { isAccessTokenValid } from "@/lib/security/validate-session-token"

const COOKIE = "tmt_session"
const MAX_AGE = 60 * 60 * 24 * 7

export async function POST(request: Request) {
  const body = (await request.json()) as { access_token?: string }
  if (!body.access_token) {
    return NextResponse.json({ error: "Token obrigatório" }, { status: 400 })
  }

  if (!(await isAccessTokenValid(body.access_token))) {
    return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, body.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  return res
}
