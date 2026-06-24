"use client"

import { useMemo } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { getAllowedNavRoutes, HOME_NAV_ROUTE, type NavRoute } from "@/lib/rbac/permissions"

export function useAllowedModuleRoutes(options?: { includeHome?: boolean }): NavRoute[] {
  const { user } = useAuth()
  const includeHome = options?.includeHome ?? false

  return useMemo(() => {
    if (!user) return []
    const routes = getAllowedNavRoutes(user.role, user.permissions)
    if (includeHome) return routes
    return routes.filter((route) => route.href !== HOME_NAV_ROUTE.href)
  }, [user, includeHome])
}
