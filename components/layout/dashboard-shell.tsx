"use client"

import { useSyncExternalStore } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useState } from "react"

const SIDEBAR_STORAGE_KEY = "tm-dashboard-sidebar-open"
const SIDEBAR_CHANGE_EVENT = "tm-sidebar-open-change"
const DESKTOP_MQ = "(min-width: 768px)"

function subscribeDesktop(onStoreChange: () => void) {
  const mq = window.matchMedia(DESKTOP_MQ)
  mq.addEventListener("change", onStoreChange)
  return () => mq.removeEventListener("change", onStoreChange)
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_MQ).matches,
    () => false,
  )
}

function readStoredSidebarOpen(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored === "0") return false
    if (stored === "1") return true
  } catch {
    /* ignore */
  }
  return true
}

function writeStoredSidebarOpen(open: boolean) {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, open ? "1" : "0")
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT))
}

function subscribeSidebarStore(onStoreChange: () => void) {
  const handler = () => onStoreChange()
  window.addEventListener("storage", handler)
  window.addEventListener(SIDEBAR_CHANGE_EVENT, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, handler)
  }
}

function useDesktopSidebarOpen() {
  return useSyncExternalStore(subscribeSidebarStore, readStoredSidebarOpen, () => true)
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop()
  const desktopSidebarOpen = useDesktopSidebarOpen()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  function toggleNav() {
    if (isDesktop) {
      writeStoredSidebarOpen(!desktopSidebarOpen)
      return
    }
    setMobileNavOpen((open) => !open)
  }

  const navOpen = isDesktop ? desktopSidebarOpen : mobileNavOpen

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 overflow-hidden border-r border-sidebar-border transition-[width] duration-200 ease-out md:block",
          desktopSidebarOpen ? "w-64" : "w-0",
        )}
        aria-hidden={!desktopSidebarOpen}
      >
        <div
          className={cn(
            "h-full w-64 transition-transform duration-200 ease-out",
            desktopSidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <AppSidebar onClose={() => writeStoredSidebarOpen(false)} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader navOpen={navOpen} onToggleNav={toggleNav} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-64 gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
        >
          <AppSidebar
            onNavigate={() => setMobileNavOpen(false)}
            onClose={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
