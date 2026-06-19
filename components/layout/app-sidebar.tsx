"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Truck,
  Users,
  Package,
  Fuel,
  Wrench,
  DollarSign,
  BarChart3,
  PanelLeftClose,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site-config"
import { useAuth } from "@/components/providers/auth-provider"
import { getAllowedNavRoutes, getDefaultHomeRoute, type NavRoute } from "@/lib/rbac/permissions"

const NAV_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/fretes": Package,
  "/dashboard/frota": Truck,
  "/dashboard/motoristas": Users,
  "/dashboard/financeiro": DollarSign,
  "/dashboard/abastecimento": Fuel,
  "/dashboard/manutencao": Wrench,
  "/dashboard/relatorios": BarChart3,
}

function SidebarLink({
  item,
  onNavigate,
}: {
  item: NavRoute & { icon: LucideIcon }
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent",
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
    >
      <item.icon className="h-4 w-4" />
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
    ? getAllowedNavRoutes(user.role, user.permissions).map((route) => ({
        ...route,
        icon: NAV_ICONS[route.href] ?? LayoutDashboard,
      }))
    : []

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center justify-between gap-2 border-b border-sidebar-border px-4">
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
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {allowedRoutes.map((item) => (
          <SidebarLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
      <p className="p-4 text-xs text-muted-foreground">{siteConfig.company}</p>
    </aside>
  )
}
