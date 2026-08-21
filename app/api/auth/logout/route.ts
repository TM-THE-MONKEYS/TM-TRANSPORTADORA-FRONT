import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import {
  REFRESH_COOKIE,
  backendApiBase,
  clearAuthCookies,
} from "@/lib/auth/session-cookies"

export async function POST() {
  const jar = await cookies()
  const refresh = jar.get(REFRESH_COOKIE)?.value
  const base = backendApiBase()

  if (refresh && base) {
    try {
      await fetch(`${base}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
        cache: "no-store",
      })
    } catch {
      /* ignore — limpa cookies mesmo assim */
    }
  }

  const res = NextResponse.json({ ok: true })
  clearAuthCookies(res)
  return res
}
