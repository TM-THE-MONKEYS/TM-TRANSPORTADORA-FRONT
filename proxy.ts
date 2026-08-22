import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get("tmt_session")?.value

  // Bloqueia rotas /api/* desconhecidas; libera auth BFF, proxy v1 e health.
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    !pathname.startsWith("/api/v1/") &&
    pathname !== "/api/backend-health"
  ) {
    return new NextResponse(null, { status: 404 })
  }

  if (pathname.startsWith("/dashboard") && !session) {
    const login = new URL("/login", request.url)
    login.searchParams.set("from", pathname)
    return NextResponse.redirect(login)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
