"use client"

import { AppHeader } from "@/components/layout/app-header"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
    </div>
  )
}
