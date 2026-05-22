"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"

/** Sends authenticated users to the dashboard (client-side session). */
export function RedirectIfAuthenticated() {
  const { isReady, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isReady && isAuthenticated) router.replace("/dashboard")
  }, [isReady, isAuthenticated, router])

  return null
}
