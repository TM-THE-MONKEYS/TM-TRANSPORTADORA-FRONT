"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PanelLeftClose, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site-config"
import { useAuth } from "@/components/providers/auth-provider"
import {
  getAllowedNavRoutes,
  getDefaultHomeRoute,
  HOME_NAV_ROUTE,
  type NavRoute,
} from "@/lib/rbac/permissions"
import { getNavIcon } from "@/lib/navigation/nav-icons"

function SidebarLink({
  item,
  onNavigate,
}: {
  item: NavRoute & { icon: LucideIcon }
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const active =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active
          ? "bg-sidebar-accent text-sidebar-primary before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-sidebar-primary"
          : "text-sidebar-foreground/85",
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" aria-hidden />
      {item.label}
    </Link>
  )
}

export function AppSidebar({
  onNavigate,
  onClose,
}: {
  onNavigate?: () => void
  onClose?: () => void
}) {
  const { user } = useAuth()
  const homeRoute = user
    ? getDefaultHomeRoute(user.role, user.permissions)
    : "/dashboard"
  const allowedRoutes = user
    ? getAllowedNavRoutes(user.role, user.permissions)
        // Home só redireciona para o Dashboard — não duplicar no menu.
        .filter((route) => route.href !== HOME_NAV_ROUTE.href)
        .map((route) => ({
          ...route,
          icon: getNavIcon(route.href),
        }))
    : []

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-[4.75rem] items-center justify-between gap-2 border-b border-sidebar-border px-4">
        <Link href={homeRoute} className="font-semibold tracking-tight" onClick={onNavigate}>
          {siteConfig.shortName}
        </Link>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-sidebar-foreground"
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Módulos">
        {allowedRoutes.map((item) => (
          <SidebarLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
      <p className="p-4 text-xs text-muted-foreground">{siteConfig.company}</p>
    </aside>
  )
}
