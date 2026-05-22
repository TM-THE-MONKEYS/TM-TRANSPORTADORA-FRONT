import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC = ["/", "/login", "/cadastro", "/termos", "/privacidade"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get("tmt_session")?.value

  const isDashboard = pathname.startsWith("/dashboard")

  // Dashboard: cookie is a coarse gate only; client auth uses sessionStorage.
  // Do not redirect /login or /cadastro when a stale cookie exists — that caused a blank dashboard.
  if (isDashboard && !session) {
    const login = new URL("/login", request.url)
    login.searchParams.set("from", pathname)
    return NextResponse.redirect(login)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
