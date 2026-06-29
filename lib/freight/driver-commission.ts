import type { FinanceEntry, FreightOrder } from "@/types"

export const DRIVER_COMMISSION_CATEGORY = "Comissão"

/** Comissão = valor do frete × percentual do motorista. */
export function computeDriverCommission(
  freightValueBrl: number,
  commissionPct?: number | null,
): number | null {
  if (!Number.isFinite(freightValueBrl) || freightValueBrl <= 0) return null
  if (commissionPct == null || !Number.isFinite(commissionPct) || commissionPct <= 0) return null
  return Math.round((freightValueBrl * commissionPct) / 100 * 100) / 100
}

export function driverCommissionDescription(freightCode: string, driverName: string): string {
  return `Comissão ${driverName} · frete ${freightCode}`
}

export function sumCommissionFromFinance(financeEntries: FinanceEntry[]): number {
  return financeEntries
    .filter((e) => e.tipo === "despesa" && e.categoria === DRIVER_COMMISSION_CATEGORY)
    .reduce((s, e) => s + e.valor, 0)
}

export interface ResolvedDriverCommission {
  amount: number
  estimated: boolean
  commissionPct?: number
  driverName?: string
}

/** Lançamento financeiro de comissão ou estimativa a partir do motorista vinculado. */
export function resolveFreightDriverCommission(
  freight: FreightOrder,
  financeEntries: FinanceEntry[],
  driver?: Pick<{ name: string; commission_pct?: number | null }, "name" | "commission_pct"> | null,
): ResolvedDriverCommission | null {
  const fromFinance = sumCommissionFromFinance(financeEntries)
  if (fromFinance > 0) {
    return { amount: fromFinance, estimated: false, driverName: driver?.name }
  }

  if (!freight.driver_id || !driver) return null

  const amount = computeDriverCommission(freight.value_brl, driver.commission_pct)
  if (amount == null || amount <= 0) return null

  return {
    amount,
    estimated: freight.status !== "entregue",
    commissionPct: driver.commission_pct ?? undefined,
    driverName: driver.name,
  }
}
