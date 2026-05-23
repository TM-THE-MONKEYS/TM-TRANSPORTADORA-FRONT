"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { canAccessRoute } from "@/lib/rbac/permissions"

/** Bloqueia módulos sem permissão; admin sempre passa. */
export function DashboardRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!isReady || !user) return
    if (!canAccessRoute(pathname, user.role, user.permissions)) {
      router.replace("/dashboard")
    }
  }, [isReady, user, pathname, router])

  if (!isReady || !user) return null

  if (!canAccessRoute(pathname, user.role, user.permissions)) {
    return null
  }

  return <>{children}</>
}
