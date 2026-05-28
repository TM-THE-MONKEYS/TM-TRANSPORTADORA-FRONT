"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { getDefaultHomeRoute } from "@/lib/rbac/permissions"

/** Sends authenticated users to their role home route. */
export function RedirectIfAuthenticated() {
  const { isReady, isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isReady && isAuthenticated && user) {
      router.replace(getDefaultHomeRoute(user.role, user.permissions))
    }
  }, [isReady, isAuthenticated, user, router])

  return null
}
