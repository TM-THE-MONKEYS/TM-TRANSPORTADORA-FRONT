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
  MapPin,
  BarChart3,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site-config"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS, type Permission } from "@/lib/rbac/permissions"
import { Badge } from "@/components/ui/badge"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  permission?: Permission
  soon?: boolean
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: PERMISSIONS.dashboard },
  { href: "/dashboard/fretes", label: "Fretes", icon: Package, permission: PERMISSIONS.freightRead },
  { href: "/dashboard/frota", label: "Frota", icon: Truck, permission: PERMISSIONS.fleetRead },
  { href: "/dashboard/motoristas", label: "Motoristas", icon: Users, permission: PERMISSIONS.driversRead },
  { href: "/dashboard/financeiro", label: "Financeiro", icon: DollarSign, soon: true },
  { href: "/dashboard/abastecimento", label: "Abastecimento", icon: Fuel, soon: true },
  { href: "/dashboard/manutencao", label: "Manutenção", icon: Wrench, soon: true },
  { href: "/dashboard/rastreamento", label: "Rastreamento", icon: MapPin, soon: true },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3, soon: true },
]

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname()
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

  if (item.soon) {
    return (
      <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground opacity-60">
        <item.icon className="h-4 w-4" />
        {item.label}
        <Badge variant="secondary" className="ml-auto text-[10px]">
          Em breve
        </Badge>
      </div>
    )
  }

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

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const canDashboard = usePermission(PERMISSIONS.dashboard)
  const canFreight = usePermission(PERMISSIONS.freightRead)
  const canFleet = usePermission(PERMISSIONS.fleetRead)
  const canDrivers = usePermission(PERMISSIONS.driversRead)

  const allowed = new Set<string>()
  if (canDashboard) allowed.add("/dashboard")
  if (canFreight) allowed.add("/dashboard/fretes")
  if (canFleet) allowed.add("/dashboard/frota")
  if (canDrivers) allowed.add("/dashboard/motoristas")

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="font-semibold tracking-tight" onClick={onNavigate}>
          {siteConfig.shortName}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          if (item.permission && !allowed.has(item.href)) return null
          return <SidebarLink key={item.href} item={item} onNavigate={onNavigate} />
        })}
      </nav>
      <p className="p-4 text-xs text-muted-foreground">{siteConfig.company}</p>
    </aside>
  )
}
