import { differenceInMinutes, parseISO } from "date-fns"
import {
  DRIVER_COMMISSION_CATEGORY,
  resolveFreightDriverCommission,
} from "@/lib/freight/driver-commission"
import type { Driver, FinanceEntry, FreightCost, FreightEvent, FreightOrder } from "@/types"

export interface FreightReportMetrics {
  tripDurationLabel: string
  tripInProgress: boolean
  freightValue: number
  totalCosts: number
  driverCommission: number
  driverCommissionEstimated: boolean
  otherExpenses: number
  totalExpenses: number
  totalSpent: number
  receivedPaid: number
  receivedPending: number
  netMargin: number
}

export function formatTripDurationMinutes(totalMinutes: number): string {
  if (totalMinutes < 1) return "menos de 1 min"
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`
}

export function computeTripDuration(
  freight: FreightOrder,
  events: FreightEvent[],
): { label: string; inProgress: boolean } {
  const sorted = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )

  const startIso = sorted[0]?.created_at ?? freight.created_at
  const endIso =
    freight.status === "entregue"
      ? sorted[sorted.length - 1]?.created_at ?? freight.updated_at
      : freight.status === "cancelado"
        ? freight.updated_at
        : null

  if (!endIso) {
    const mins = differenceInMinutes(new Date(), parseISO(startIso))
    return {
      label: `${formatTripDurationMinutes(Math.max(0, mins))} (em andamento)`,
      inProgress: true,
    }
  }

  const mins = differenceInMinutes(parseISO(endIso), parseISO(startIso))
  return {
    label: formatTripDurationMinutes(Math.max(0, mins)),
    inProgress: false,
  }
}

export function buildFreightReportMetrics(
  freight: FreightOrder,
  events: FreightEvent[],
  costs: FreightCost[],
  financeEntries: FinanceEntry[],
  driver?: Pick<Driver, "name" | "commission_pct"> | null,
): FreightReportMetrics {
  const { label, inProgress } = computeTripDuration(freight, events)

  const totalCosts = costs.reduce((s, c) => s + c.valor, 0)
  const receitas = financeEntries.filter((e) => e.tipo === "receita")
  const despesas = financeEntries.filter((e) => e.tipo === "despesa")

  const receivedPaid = receitas
    .filter((e) => e.status === "pago")
    .reduce((s, e) => s + e.valor, 0)
  const receivedPending = receitas
    .filter((e) => e.status !== "pago" && e.status !== "cancelado")
    .reduce((s, e) => s + e.valor, 0)

  const commission = resolveFreightDriverCommission(freight, financeEntries, driver)
  const driverCommission = commission?.amount ?? 0
  const driverCommissionEstimated = commission?.estimated ?? false
  const otherExpenses = despesas
    .filter((e) => e.categoria !== DRIVER_COMMISSION_CATEGORY)
    .reduce((s, e) => s + e.valor, 0)
  const totalExpenses = otherExpenses + driverCommission
  const totalSpent = totalCosts + totalExpenses

  const revenueBase = receivedPaid > 0 ? receivedPaid : freight.value_brl

  return {
    tripDurationLabel: label,
    tripInProgress: inProgress,
    freightValue: freight.value_brl,
    totalCosts,
    driverCommission,
    driverCommissionEstimated,
    otherExpenses,
    totalExpenses,
    totalSpent,
    receivedPaid,
    receivedPending,
    netMargin: revenueBase - totalSpent,
  }
}

export function sortFreightsByRecent(items: FreightOrder[]): FreightOrder[] {
  return [...items].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )
}
