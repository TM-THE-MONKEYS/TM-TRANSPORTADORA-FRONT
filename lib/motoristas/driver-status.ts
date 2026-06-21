import type { DriverStatus } from "@/types"

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  suspenso: "Suspenso",
  ferias: "Férias",
}

export const DRIVER_STATUS_VARIANT: Record<
  DriverStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ativo: "default",
  inativo: "secondary",
  suspenso: "destructive",
  ferias: "outline",
}

export function formatCommissionPct(value?: number | null): string {
  if (value == null) return "—"
  return `${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`
}

export function driverInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}
