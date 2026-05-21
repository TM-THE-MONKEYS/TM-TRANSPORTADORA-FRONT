"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { useAuth } from "@/components/providers/auth-provider"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isReady, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isReady && !isAuthenticated) router.replace("/login")
  }, [isReady, isAuthenticated, router])

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <DashboardShell>{children}</DashboardShell>
}
