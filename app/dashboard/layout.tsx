"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardRouteGuard } from "@/components/layout/dashboard-route-guard"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { MustChangePasswordGuard } from "@/components/auth/must-change-password-guard"
import { useAuth } from "@/components/providers/auth-provider"
import { Skeleton } from "@/components/ui/skeleton"

async function clearStaleSessionCookie() {
  try {
    await fetch("/api/auth/session", { method: "DELETE" })
  } catch {
    /* ignore */
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isReady, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isReady || isAuthenticated) return
    void clearStaleSessionCookie().finally(() => {
      router.replace("/login")
    })
  }, [isReady, isAuthenticated, router])

  if (!isReady || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-8 w-48" />
      </div>
    )
  }

  return (
    <MustChangePasswordGuard>
      <DashboardShell>
        <DashboardRouteGuard>{children}</DashboardRouteGuard>
      </DashboardShell>
    </MustChangePasswordGuard>
  )
}
