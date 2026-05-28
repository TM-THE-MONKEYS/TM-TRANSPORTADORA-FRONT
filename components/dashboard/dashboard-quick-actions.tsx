"use client"

import Link from "next/link"
import {
  BarChart3,
  DollarSign,
  Fuel,
  MapPin,
  Package,
  PackagePlus,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import { cn } from "@/lib/utils"

type QuickAction = {
  href: string
  label: string
  description: string
  icon: LucideIcon
  permission?: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
}

const actions: QuickAction[] = [
  {
    href: "/dashboard/fretes/novo",
    label: "Novo frete",
    description: "Abrir ordem de transporte",
    icon: PackagePlus,
    permission: PERMISSIONS.freightWrite,
  },
  {
    href: "/dashboard/fretes",
    label: "Fretes",
    description: "Lista e status",
    icon: Package,
    permission: PERMISSIONS.freightRead,
  },
  {
    href: "/dashboard/rastreamento",
    label: "Rastreamento",
    description: "Timeline em trânsito",
    icon: MapPin,
    permission: PERMISSIONS.freightRead,
  },
  {
    href: "/dashboard/frota",
    label: "Frota",
    description: "Caminhões e status",
    icon: Truck,
    permission: PERMISSIONS.fleetRead,
  },
  {
    href: "/dashboard/motoristas",
    label: "Motoristas",
    description: "Cadastro e vínculos",
    icon: Users,
    permission: PERMISSIONS.driversRead,
  },
  {
    href: "/dashboard/abastecimento",
    label: "Abastecimento",
    description: "Registrar combustível",
    icon: Fuel,
    permission: PERMISSIONS.freightRead,
  },
  {
    href: "/dashboard/manutencao",
    label: "Manutenção",
    description: "Alertas da frota",
    icon: Wrench,
    permission: PERMISSIONS.fleetRead,
  },
  {
    href: "/dashboard/financeiro",
    label: "Financeiro",
    description: "Receitas e despesas",
    icon: DollarSign,
    permission: PERMISSIONS.financeRead,
  },
  {
    href: "/dashboard/relatorios",
    label: "Relatórios",
    description: "KPIs e análises",
    icon: BarChart3,
    permission: PERMISSIONS.financeRead,
  },
]

export function DashboardQuickActions() {
  const canFreightWrite = usePermission(PERMISSIONS.freightWrite)
  const canFreightRead = usePermission(PERMISSIONS.freightRead)
  const canFleet = usePermission(PERMISSIONS.fleetRead)
  const canDrivers = usePermission(PERMISSIONS.driversRead)
  const canFinance = usePermission(PERMISSIONS.financeRead)
  const canDashboard = usePermission(PERMISSIONS.dashboard)

  const permissionMap: Record<string, boolean> = {
    [PERMISSIONS.freightWrite]: canFreightWrite,
    [PERMISSIONS.freightRead]: canFreightRead,
    [PERMISSIONS.fleetRead]: canFleet,
    [PERMISSIONS.driversRead]: canDrivers,
    [PERMISSIONS.financeRead]: canFinance,
    [PERMISSIONS.dashboard]: canDashboard,
  }

  const visible = actions.filter(
    (a) => !a.permission || permissionMap[a.permission],
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Acesso rápido</CardTitle>
        <CardDescription className="sr-only sm:not-sr-only">
          Atalhos para as áreas da operação
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
          {visible.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "group flex min-w-[9.5rem] shrink-0 items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5 transition-colors sm:min-w-0",
                "hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              <action.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{action.label}</p>
                <p className="truncate text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
