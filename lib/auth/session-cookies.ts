import { NextResponse } from "next/server"

export const ACCESS_COOKIE = "tmt_session"
export const REFRESH_COOKIE = "tmt_refresh"

const ACCESS_MAX_AGE = 60 * 60 * 24 * 7 // alinhado ao refresh; JWT real expira antes
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7

function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production"
}

export function setAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string | null,
): void {
  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  })
  if (refreshToken) {
    res.cookies.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_MAX_AGE,
    })
  }
}

export function clearAuthCookies(res: NextResponse): void {
  const base = {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  }
  res.cookies.set(ACCESS_COOKIE, "", base)
  res.cookies.set(REFRESH_COOKIE, "", base)
}

export function backendApiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "")
}
