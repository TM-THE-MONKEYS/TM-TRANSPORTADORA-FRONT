import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import type { CashFlowSummary, FinanceEntry, FinanceEntryStatus, FinanceEntryType, Paginated } from "@/types"

// ── Mock data ────────────────────────────────────────────────────────────────

const mockEntries: FinanceEntry[] = [
  {
    id: "fin-1",
    tipo: "receita",
    categoria: "Frete",
    descricao: "Frete OF-2026-0001",
    valor: 18500,
    status: "pago",
    data_vencimento: "2026-05-15",
    created_at: "2026-05-10T08:00:00Z",
    updated_at: "2026-05-15T10:00:00Z",
  },
  {
    id: "fin-2",
    tipo: "despesa",
    categoria: "Combustível",
    descricao: "Abastecimento Volvo ABC1D23",
    valor: 3200,
    status: "pago",
    data_vencimento: "2026-05-12",
    created_at: "2026-05-12T08:00:00Z",
    updated_at: "2026-05-12T08:00:00Z",
  },
  {
    id: "fin-3",
    tipo: "despesa",
    categoria: "Manutenção",
    descricao: "Revisão preventiva Scania XYZ9K87",
    valor: 4500,
    status: "pendente",
    data_vencimento: "2026-05-30",
    created_at: "2026-05-20T08:00:00Z",
    updated_at: "2026-05-20T08:00:00Z",
  },
]

const mockCashFlow: CashFlowSummary = {
  total_receitas: 18500,
  total_despesas: 7700,
  saldo: 10800,
  receitas_pendentes: 0,
  despesas_pendentes: 4500,
  receitas_pagas: 18500,
  despesas_pagas: 3200,
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function listFinanceEntries(
  page = 1,
  pageSize = 20,
  tipo?: FinanceEntryType,
  status?: FinanceEntryStatus,
): Promise<Paginated<FinanceEntry>> {
  if (shouldUseMocks()) {
    let items = [...mockEntries]
    if (tipo) items = items.filter((e) => e.tipo === tipo)
    if (status) items = items.filter((e) => e.status === status)
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
  return apiRequest(`/finance?${qs}`, { auth: true })
}

export async function getCashFlow(): Promise<CashFlowSummary> {
  if (shouldUseMocks()) return mockCashFlow
  return apiRequest("/finance/cash-flow", { auth: true })
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
    mockEntries.unshift(entry)
    return entry
  }
  return apiRequest("/finance", { method: "POST", body: data, auth: true })
}

export async function updateFinanceEntry(
  id: string,
  data: Partial<FinanceEntry>,
): Promise<FinanceEntry> {
  if (shouldUseMocks()) {
    const idx = mockEntries.findIndex((e) => e.id === id)
    if (idx < 0) throw new Error("Lançamento não encontrado")
    mockEntries[idx] = { ...mockEntries[idx], ...data, updated_at: new Date().toISOString() }
    return mockEntries[idx]
  }
  return apiRequest(`/finance/${id}`, { method: "PATCH", body: data, auth: true })
}

export async function deleteFinanceEntry(id: string): Promise<void> {
  if (shouldUseMocks()) return
  return apiRequest(`/finance/${id}`, { method: "DELETE", auth: true })
}
