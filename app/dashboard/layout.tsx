"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/layout/dashboard-shell"
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

  return <DashboardShell>{children}</DashboardShell>
}
