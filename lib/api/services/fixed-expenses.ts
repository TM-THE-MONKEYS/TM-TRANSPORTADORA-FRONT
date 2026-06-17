import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import { generateId } from "@/lib/mocks/store"
import type { FixedExpense, FixedExpenseFrequency } from "@/types"

// ── Mock store ────────────────────────────────────────────────────────────────

const mockFixed: FixedExpense[] = [
  {
    id: "fx-1",
    nome: "Aluguel do galpão",
    categoria: "Aluguel",
    valor: 8500,
    frequencia: "mensal",
    dia_vencimento: 5,
    ativo: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "fx-2",
    nome: "Seguro da frota",
    categoria: "Seguro",
    valor: 3200,
    frequencia: "mensal",
    dia_vencimento: 10,
    ativo: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "fx-3",
    nome: "Folha de pagamento",
    categoria: "Salários",
    valor: 22000,
    frequencia: "mensal",
    dia_vencimento: 30,
    ativo: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "fx-4",
    nome: "IPVA / Licenciamento frota",
    categoria: "IPVA / Licenciamento",
    valor: 4800,
    frequencia: "anual",
    dia_vencimento: 15,
    ativo: true,
    observacao: "Parcelado em 3x para cada veículo",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "fx-5",
    nome: "Contador / Serviços contábeis",
    categoria: "Serviços",
    valor: 1200,
    frequencia: "mensal",
    dia_vencimento: 15,
    ativo: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "fx-6",
    nome: "Internet e telefonia",
    categoria: "Utilities",
    valor: 450,
    frequencia: "mensal",
    dia_vencimento: 20,
    ativo: false,
    observacao: "Contrato encerrado em jan/2026",
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
  },
]

// ── Service functions ─────────────────────────────────────────────────────────

export async function listFixedExpenses(): Promise<FixedExpense[]> {
  if (shouldUseMocks()) return [...mockFixed]
  return apiRequest("/finance/fixed-expenses", { auth: true })
}

export async function createFixedExpense(
  data: Omit<FixedExpense, "id" | "created_at" | "updated_at">,
): Promise<FixedExpense> {
  if (shouldUseMocks()) {
    const entry: FixedExpense = {
      ...data,
      id: generateId("fx"),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockFixed.unshift(entry)
    return entry
  }
  return apiRequest("/finance/fixed-expenses", { method: "POST", body: data, auth: true })
}

export async function updateFixedExpense(
  id: string,
  data: Partial<Omit<FixedExpense, "id" | "created_at" | "updated_at">>,
): Promise<FixedExpense> {
  if (shouldUseMocks()) {
    const idx = mockFixed.findIndex((e) => e.id === id)
    if (idx < 0) throw new Error("Gasto fixo não encontrado")
    mockFixed[idx] = { ...mockFixed[idx], ...data, updated_at: new Date().toISOString() }
    return mockFixed[idx]
  }
  return apiRequest(`/finance/fixed-expenses/${id}`, { method: "PATCH", body: data, auth: true })
}

export async function deleteFixedExpense(id: string): Promise<void> {
  if (shouldUseMocks()) {
    const idx = mockFixed.findIndex((e) => e.id === id)
    if (idx >= 0) mockFixed.splice(idx, 1)
    return
  }
  return apiRequest(`/finance/fixed-expenses/${id}`, { method: "DELETE", auth: true })
}

/** Cria um lançamento financeiro avulso a partir do gasto fixo. */
export async function launchFixedExpense(
  id: string,
  vencimento?: string,
): Promise<void> {
  if (shouldUseMocks()) {
    const fx = mockFixed.find((e) => e.id === id)
    if (!fx) throw new Error("Gasto fixo não encontrado")
    const { mockFinanceEntries } = await import("@/lib/mocks/finance-sync")
    mockFinanceEntries.unshift({
      id: generateId("fin"),
      tipo: "despesa",
      categoria: fx.categoria,
      descricao: fx.nome,
      valor: fx.valor,
      status: "pendente",
      data_vencimento: vencimento,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    return
  }
  return apiRequest(`/finance/fixed-expenses/${id}/launch`, {
    method: "POST",
    body: vencimento ? { data_vencimento: vencimento } : undefined,
    auth: true,
  })
}

export const FIXED_EXPENSE_CATEGORIES = [
  "Aluguel",
  "Seguro",
  "Salários",
  "IPVA / Licenciamento",
  "Impostos",
  "Manutenção",
  "Serviços",
  "Utilities",
  "Outros",
] as const

export const FREQUENCY_LABELS: Record<FixedExpenseFrequency, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
}

/** Valor mensal equivalente de um gasto fixo. */
export function monthlyEquivalent(fx: FixedExpense): number {
  switch (fx.frequencia) {
    case "mensal":      return fx.valor
    case "trimestral":  return fx.valor / 3
    case "semestral":   return fx.valor / 6
    case "anual":       return fx.valor / 12
  }
}
