import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC = ["/", "/login", "/cadastro", "/termos", "/privacidade", "/esqueci-senha", "/redefinir-senha"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get("tmt_session")?.value

  if (
    pathname.startsWith("/api/") &&
    pathname !== "/api/auth/session" &&
    !pathname.startsWith("/api/v1/") &&
    pathname !== "/api/backend-health"
  ) {
    return new NextResponse(null, { status: 404 })
  }

  const isDashboard = pathname.startsWith("/dashboard")

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
