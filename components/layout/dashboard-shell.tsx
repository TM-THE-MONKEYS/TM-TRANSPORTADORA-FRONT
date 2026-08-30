import { AppHeader } from "@/components/layout/app-header"
import { AppNavStrip } from "@/components/layout/app-nav-strip"
import { AppFooter } from "@/components/layout/app-footer"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <AppNavStrip />
      <main className="flex-1 p-4 md:p-6">{children}</main>
      <AppFooter />
    </div>
  )
}
