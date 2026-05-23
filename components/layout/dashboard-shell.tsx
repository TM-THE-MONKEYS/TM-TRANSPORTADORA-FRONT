"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { cn } from "@/lib/utils"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function toggleSidebar() {
    setSidebarOpen((open) => !open)
  }

  function closeSidebar() {
    setSidebarOpen(false)
  }

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
          onClick={closeSidebar}
        />
      )}

      <aside
        id="dashboard-sidebar"
        aria-hidden={!sidebarOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 shadow-xl transition-transform duration-200 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
        )}
      >
        <AppSidebar onNavigate={closeSidebar} onClose={closeSidebar} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader sidebarOpen={sidebarOpen} onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
