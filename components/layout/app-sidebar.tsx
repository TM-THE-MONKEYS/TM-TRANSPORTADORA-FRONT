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

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  permission: Permission
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: PERMISSIONS.dashboard },
  { href: "/dashboard/fretes", label: "Fretes", icon: Package, permission: PERMISSIONS.freightRead },
  { href: "/dashboard/frota", label: "Frota", icon: Truck, permission: PERMISSIONS.fleetRead },
  { href: "/dashboard/motoristas", label: "Motoristas", icon: Users, permission: PERMISSIONS.driversRead },
  { href: "/dashboard/financeiro", label: "Financeiro", icon: DollarSign, permission: PERMISSIONS.financeRead },
  { href: "/dashboard/abastecimento", label: "Abastecimento", icon: Fuel, permission: PERMISSIONS.freightRead },
  { href: "/dashboard/manutencao", label: "Manutenção", icon: Wrench, permission: PERMISSIONS.fleetRead },
  { href: "/dashboard/rastreamento", label: "Rastreamento", icon: MapPin, permission: PERMISSIONS.freightRead },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3, permission: PERMISSIONS.dashboard },
]

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
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

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const canDashboard = usePermission(PERMISSIONS.dashboard)
  const canFreight = usePermission(PERMISSIONS.freightRead)
  const canFleet = usePermission(PERMISSIONS.fleetRead)
  const canDrivers = usePermission(PERMISSIONS.driversRead)
  const canFinance = usePermission(PERMISSIONS.financeRead)

  const allowed = new Set<string>()
  if (canDashboard) {
    allowed.add("/dashboard")
    allowed.add("/dashboard/relatorios")
  }
  if (canFreight) {
    allowed.add("/dashboard/fretes")
    allowed.add("/dashboard/abastecimento")
    allowed.add("/dashboard/rastreamento")
  }
  if (canFleet) {
    allowed.add("/dashboard/frota")
    allowed.add("/dashboard/manutencao")
  }
  if (canDrivers) allowed.add("/dashboard/motoristas")
  if (canFinance) allowed.add("/dashboard/financeiro")

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="font-semibold tracking-tight" onClick={onNavigate}>
          {siteConfig.shortName}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          if (!allowed.has(item.href)) return null
          return <SidebarLink key={item.href} item={item} onNavigate={onNavigate} />
        })}
      </nav>
      <p className="p-4 text-xs text-muted-foreground">{siteConfig.company}</p>
    </aside>
  )
}
