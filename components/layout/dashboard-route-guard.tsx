"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { canAccessRoute, getDefaultHomeRoute } from "@/lib/rbac/permissions"

/** Bloqueia módulos sem permissão; admin sempre passa. */
export function DashboardRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!isReady || !user) return
    if (!canAccessRoute(pathname, user.role, user.permissions)) {
      const home = getDefaultHomeRoute(user.role, user.permissions)
      if (pathname !== home) {
        router.replace(home)
      }
    }
  }, [isReady, user, pathname, router])

  if (!isReady || !user) return null

  if (!canAccessRoute(pathname, user.role, user.permissions)) {
    return null
  }

  return <>{children}</>
}
