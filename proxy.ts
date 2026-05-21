import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC = ["/", "/login", "/cadastro", "/termos", "/privacidade"]
const AUTH_ONLY = ["/login", "/cadastro"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get("tmt_session")?.value

  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const isDashboard = pathname.startsWith("/dashboard")
  const isAuthPage = AUTH_ONLY.includes(pathname)

  if (isDashboard && !session) {
    const login = new URL("/login", request.url)
    login.searchParams.set("from", pathname)
    return NextResponse.redirect(login)
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!isPublic && !isDashboard && pathname !== "/") {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
