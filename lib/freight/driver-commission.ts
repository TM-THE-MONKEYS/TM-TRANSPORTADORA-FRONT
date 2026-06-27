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
