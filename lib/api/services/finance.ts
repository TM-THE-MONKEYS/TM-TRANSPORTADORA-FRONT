import { mutate } from "swr"
import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import { mockFinanceEntries } from "@/lib/mocks/finance-sync"
import type {
  CashFlowSummary,
  CompetenciaReport,
  FinanceEntry,
  FinanceEntryStatus,
  FinanceEntryType,
  Paginated,
} from "@/types"

function computeMockCashFlow(): CashFlowSummary {
  let total_receitas = 0
  let total_despesas = 0
  let receitas_pendentes = 0
  let despesas_pendentes = 0
  let receitas_pagas = 0
  let despesas_pagas = 0

  for (const e of mockFinanceEntries) {
    if (e.tipo === "receita") {
      total_receitas += e.valor
      if (e.status === "pendente") receitas_pendentes += e.valor
      if (e.status === "pago") receitas_pagas += e.valor
    } else if (e.tipo === "despesa") {
      total_despesas += e.valor
      if (e.status === "pendente") despesas_pendentes += e.valor
      if (e.status === "pago") despesas_pagas += e.valor
    }
  }

  return {
    total_receitas,
    total_despesas,
    saldo: total_receitas - total_despesas,
    receitas_pendentes,
    despesas_pendentes,
    receitas_pagas,
    despesas_pagas,
  }
}

// ── Service functions ─────────────────────────────────────────────────────────
export async function listFinanceEntries(
  page = 1,
  pageSize = 20,
  tipo?: FinanceEntryType,
  status?: FinanceEntryStatus,
  freightId?: string,
  competencia?: { mes: number; ano: number },
): Promise<Paginated<FinanceEntry>> {
  if (shouldUseMocks()) {
    let items = [...mockFinanceEntries]
    if (tipo) items = items.filter((e) => e.tipo === tipo)
    if (status) items = items.filter((e) => e.status === status)
    if (freightId) items = items.filter((e) => e.freight_id === freightId)
    if (competencia) {
      items = items.filter((e) => {
        const ref = e.data_vencimento ?? e.data_pagamento ?? e.created_at
        const d = new Date(ref)
        return d.getMonth() + 1 === competencia.mes && d.getFullYear() === competencia.ano
      })
    }
    const start = (page - 1) * pageSize
    return {
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      page_size: pageSize,
      pages: Math.max(1, Math.ceil(items.length / pageSize)),
    }
  }
  const qs = new URLSearchParams({ page: String(page), size: String(pageSize) })
  if (tipo) qs.set("tipo", tipo)
  if (status) qs.set("status", status)
  if (freightId) qs.set("freight_id", freightId)
  if (competencia) {
    qs.set("competencia_mes", String(competencia.mes))
    qs.set("competencia_ano", String(competencia.ano))
  }
  return apiRequest(`/finance?${qs}`, { auth: true })
}

export async function listFinanceByFreight(
  freightId: string,
  pageSize = 50,
): Promise<FinanceEntry[]> {
  const page = await listFinanceEntries(1, pageSize, undefined, undefined, freightId)
  return page.items
}

export async function getCashFlow(competencia?: { mes: number; ano: number }): Promise<CashFlowSummary> {
  if (shouldUseMocks()) return computeMockCashFlow()
  const qs = new URLSearchParams()
  if (competencia) {
    qs.set("competencia_mes", String(competencia.mes))
    qs.set("competencia_ano", String(competencia.ano))
  }
  const suffix = qs.toString() ? `?${qs}` : ""
  return apiRequest(`/finance/cash-flow${suffix}`, { auth: true })
}

export async function getCompetenciaReport(
  competencia: { mes: number; ano: number },
): Promise<CompetenciaReport> {
  if (shouldUseMocks()) {
    const cash_flow = await getCashFlow(competencia)
    const page = await listFinanceEntries(1, 500, undefined, undefined, undefined, competencia)
    const dailyMap = new Map<string, { receitas: number; despesas: number }>()
    const catMap = new Map<string, number>()

    for (const e of page.items) {
      const ref = e.data_vencimento ?? e.data_pagamento ?? e.created_at
      const day = ref.slice(0, 10)
      const row = dailyMap.get(day) ?? { receitas: 0, despesas: 0 }
      if (e.tipo === "receita") row.receitas += e.valor
      else if (e.tipo === "despesa") {
        row.despesas += e.valor
        catMap.set(e.categoria, (catMap.get(e.categoria) ?? 0) + e.valor)
      }
      dailyMap.set(day, row)
    }

    return {
      competencia_mes: competencia.mes,
      competencia_ano: competencia.ano,
      cash_flow,
      daily_series: [...dailyMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, vals]) => ({ date, ...vals })),
      expenses_by_category: [...catMap.entries()]
        .map(([categoria, valor]) => ({ categoria, valor }))
        .sort((a, b) => b.valor - a.valor),
    }
  }

  const qs = new URLSearchParams({
    competencia_mes: String(competencia.mes),
    competencia_ano: String(competencia.ano),
  })
  return apiRequest(`/finance/competencia-report?${qs}`, { auth: true })
}

/** Gera receitas (fretes) e despesas (abastecimentos/custos) no financeiro. */
export async function syncFinanceFromFreights(): Promise<{ receitas: number; despesas: number }> {
  if (shouldUseMocks()) return syncMockFinanceFromFreights()
  return apiRequest("/finance/sync-from-freights", { method: "POST", auth: true })
}

async function syncMockFinanceFromFreights(): Promise<{ receitas: number; despesas: number }> {
  const { mockStore, generateId } = await import("@/lib/mocks/store")
  let receitas = 0
  let despesas = 0

  for (const freight of mockStore.freights) {
    const hasRevenue = mockFinanceEntries.some(
      (e) => e.freight_id === freight.id && e.tipo === "receita",
    )
    if (!hasRevenue && freight.value_brl > 0) {
      const { ensureMockFreightRevenue } = await import("@/lib/mocks/finance-sync")
      ensureMockFreightRevenue(freight)
      receitas++
    }

    if (freight.status === "entregue" && freight.driver_id) {
      const driver = mockStore.drivers.find((d) => d.id === freight.driver_id)
      const { ensureMockDriverCommissionExpense } = await import("@/lib/mocks/finance-sync")
      if (ensureMockDriverCommissionExpense(freight, driver)) despesas++
    }
  }

  for (const refill of mockStore.fuelRefills ?? []) {
    const exists = mockFinanceEntries.some(
      (e) => e.freight_id === refill.freight_id && e.tipo === "despesa" && e.valor === refill.valor_total,
    )
    if (exists) continue
    const { addMockFuelExpense } = await import("@/lib/mocks/finance-sync")
    addMockFuelExpense(refill, refill.posto ?? "Abastecimento")
    despesas++
  }

  for (const cost of mockStore.freightCosts) {
    const linked = (mockStore.fuelRefills ?? []).some((r) => r.freight_cost_id === cost.id)
    if (linked) continue
    const has = mockFinanceEntries.some(
      (e) => e.freight_id === cost.freight_id && e.valor === cost.valor && e.tipo === "despesa",
    )
    if (has) continue
    mockFinanceEntries.unshift({
      id: generateId("fin"),
      tipo: "despesa",
      categoria: cost.tipo === "combustivel" ? "Combustível" : cost.tipo,
      descricao: cost.descricao ?? cost.tipo,
      valor: cost.valor,
      status: "pago",
      freight_id: cost.freight_id,
      created_at: cost.created_at,
      updated_at: cost.created_at,
    })
    despesas++
  }

  return { receitas, despesas }
}

export function invalidateFinanceCaches(): void {
  void mutate("cash-flow")
  void mutate((key) => Array.isArray(key) && key[0] === "finance-entries")
  void mutate((key) => Array.isArray(key) && key[0] === "competencia-report")
  void mutate((key) => Array.isArray(key) && key[0] === "fixed-launch-status")
  void mutate("reports-kpis")
  void mutate(
    (key) =>
      Array.isArray(key) &&
      (key[0] === "report-freight-finance" || key[0] === "report-freight-costs"),
  )
}

export async function createFinanceEntry(
  data: Omit<FinanceEntry, "id" | "created_at" | "updated_at">,
): Promise<FinanceEntry> {
  if (shouldUseMocks()) {
    const entry: FinanceEntry = {
      ...data,
      id: `fin-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockFinanceEntries.unshift(entry)
    return entry
  }
  return apiRequest("/finance", { method: "POST", body: data, auth: true })
}

export async function updateFinanceEntry(
  id: string,
  data: Partial<FinanceEntry>,
): Promise<FinanceEntry> {
  if (shouldUseMocks()) {
    const idx = mockFinanceEntries.findIndex((e) => e.id === id)
    if (idx < 0) throw new Error("Lançamento não encontrado")
    mockFinanceEntries[idx] = {
      ...mockFinanceEntries[idx],
      ...data,
      updated_at: new Date().toISOString(),
    }
    return mockFinanceEntries[idx]
  }
  return apiRequest(`/finance/${id}`, { method: "PATCH", body: data, auth: true })
}

export async function deleteFinanceEntry(id: string): Promise<void> {
  if (shouldUseMocks()) {
    const idx = mockFinanceEntries.findIndex((e) => e.id === id)
    if (idx >= 0) mockFinanceEntries.splice(idx, 1)
    return
  }
  return apiRequest(`/finance/${id}`, { method: "DELETE", auth: true })
}
