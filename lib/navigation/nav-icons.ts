import {
  DollarSign,
  Fuel,
  Home,
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react"

export const NAV_ICON_MAP: Record<string, LucideIcon> = {
  "/dashboard/home": Home,
  "/dashboard": LayoutDashboard,
  "/dashboard/fretes": Package,
  "/dashboard/frota": Truck,
  "/dashboard/motoristas": Users,
  "/dashboard/abastecimento": Fuel,
  "/dashboard/manutencao": Wrench,
  "/dashboard/financeiro": DollarSign,
}

export function getNavIcon(href: string): LucideIcon {
  return NAV_ICON_MAP[href] ?? LayoutDashboard
}
