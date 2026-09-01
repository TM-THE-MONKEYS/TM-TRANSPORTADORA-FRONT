import type { FinanceEntry, FinanceEntryStatus, FreightOrder } from "@/types"

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

/** Ainda deve ao motorista (pendente ou vencido). Cancelado/pago fora. */
export function isCommissionUnpaid(status: FinanceEntryStatus): boolean {
  return status === "pendente" || status === "vencido"
}

export function isCommissionPaid(status: FinanceEntryStatus): boolean {
  return status === "pago"
}

/**
 * A comissão nasce com descrição "Comissão {nome} · frete {code}".
 * Esse nome é a atribuição histórica — não muda se o frete trocar de motorista depois.
 */
export function commissionBelongsToDriverName(
  descricao: string | undefined,
  driverName: string,
): boolean {
  const name = driverName.trim()
  if (!name || !descricao) return false
  return descricao.startsWith(`Comissão ${name}`)
}

/**
 * Filtra comissões do motorista para fechamento de pagamento.
 *
 * Atribuição do motorista (fonte da verdade):
 *   1. Descrição congelada na criação — "Comissão {nome} · …"
 *   2. Só se não houver nome: frete.driver_id atual (legado / dados incompletos)
 *
 * Caminhão (filtro opcional de refinamento):
 *   Usa frete.truck_id atual. Aviso: se o caminhão do frete mudar depois,
 *   o filtro segue o vínculo operacional atual — o pagamento continua do motorista.
 *
 * Cancelados nunca entram no fechamento.
 */
export function filterCommissionEntriesForDriver(
  entries: FinanceEntry[],
  freights: FreightOrder[],
  driverId: string,
  opts: { driverName: string; truckId?: string },
): FinanceEntry[] {
  const freightById = new Map(freights.map((f) => [f.id, f]))
  const driverName = opts.driverName.trim()

  return entries.filter((e) => {
    if (e.tipo !== "despesa" || e.categoria !== DRIVER_COMMISSION_CATEGORY) return false
    if (e.status === "cancelado") return false
    if (!e.freight_id) return false

    const freight = freightById.get(e.freight_id)
    const byDescription = commissionBelongsToDriverName(e.descricao, driverName)
    const byCurrentFreightDriver = freight?.driver_id === driverId

    // Preferência: descrição histórica. Sem nome útil, cai no vínculo atual do frete.
    const belongsToDriver = driverName
      ? byDescription
      : byCurrentFreightDriver

    if (!belongsToDriver) return false

    if (opts.truckId) {
      // Sem frete no cache não dá para afirmar o caminhão com segurança.
      if (!freight) return false
      if (freight.truck_id !== opts.truckId) return false
    }

    return true
  })
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
