import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import { generateId } from "@/lib/mocks/store"
import type { FixedExpense, FixedExpenseFrequency, FixedExpenseLaunchStatus, LaunchPendingResult } from "@/types"

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

// ── Parcelas / vigência ───────────────────────────────────────────────────────

function parseIsoDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}

export function isFixedExpenseExpired(fx: FixedExpense, now = new Date()): boolean {
  if (!fx.total_parcelas || fx.total_parcelas <= 0) return false

  if ((fx.parcelas_lancadas ?? 0) >= fx.total_parcelas) return true

  const start = parseIsoDate(fx.data_inicio ?? fx.created_at)
  return monthsBetween(start, now) >= fx.total_parcelas
}

export function isFixedExpenseActive(fx: FixedExpense, now = new Date()): boolean {
  return fx.ativo && !isFixedExpenseExpired(fx, now)
}

export function fixedExpenseRemainingParcelas(fx: FixedExpense): number | null {
  if (!fx.total_parcelas || fx.total_parcelas <= 0) return null
  return Math.max(0, fx.total_parcelas - (fx.parcelas_lancadas ?? 0))
}

export function fixedExpenseEndDate(fx: FixedExpense): Date | null {
  if (!fx.total_parcelas || fx.total_parcelas <= 0) return null
  const start = parseIsoDate(fx.data_inicio ?? fx.created_at)
  return new Date(start.getFullYear(), start.getMonth() + fx.total_parcelas, start.getDate())
}

function syncFixedExpenseExpiry(fx: FixedExpense): FixedExpense {
  if (!fx.ativo || !isFixedExpenseExpired(fx)) return fx
  return { ...fx, ativo: false, updated_at: new Date().toISOString() }
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function listFixedExpenses(): Promise<FixedExpense[]> {
  if (shouldUseMocks()) {
    for (let i = 0; i < mockFixed.length; i++) {
      mockFixed[i] = syncFixedExpenseExpiry(mockFixed[i])
    }
    return [...mockFixed]
  }
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
    const idx = mockFixed.findIndex((e) => e.id === id)
    if (idx < 0) throw new Error("Gasto fixo não encontrado")
    const fx = mockFixed[idx]
    if (!isFixedExpenseActive(fx)) {
      throw new Error("Gasto fixo encerrado — vigência ou parcelas esgotadas")
    }
    if (fx.total_parcelas && (fx.parcelas_lancadas ?? 0) >= fx.total_parcelas) {
      throw new Error("Todas as parcelas deste gasto fixo já foram lançadas")
    }

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

    const parcelas_lancadas = (fx.parcelas_lancadas ?? 0) + 1
    const expired =
      Boolean(fx.total_parcelas) &&
      (parcelas_lancadas >= fx.total_parcelas! ||
        isFixedExpenseExpired({ ...fx, parcelas_lancadas }))
    mockFixed[idx] = {
      ...fx,
      parcelas_lancadas,
      ativo: expired ? false : fx.ativo,
      updated_at: new Date().toISOString(),
    }
    return
  }
  return apiRequest(`/finance/fixed-expenses/${id}/launch`, {
    method: "POST",
    body: vencimento ? { data_vencimento: vencimento } : undefined,
    auth: true,
  })
}

export async function getFixedExpenseLaunchStatus(
  competencia: { mes: number; ano: number },
): Promise<FixedExpenseLaunchStatus[]> {
  if (shouldUseMocks()) {
    const { mockFinanceEntries } = await import("@/lib/mocks/finance-sync")
    return mockFixed
      .filter((fx) => isFixedExpenseActive(fx))
      .map((fx) => {
        const key = `fixed_expense:${fx.id}:${competencia.ano}-${String(competencia.mes).padStart(2, "0")}`
        const linked = mockFinanceEntries.find((e) => e.observacoes?.startsWith(key))
        return {
          id: fx.id,
          nome: fx.nome,
          categoria: fx.categoria,
          valor: fx.valor,
          ativo: fx.ativo,
          launched_this_month: Boolean(linked),
          linked_entry_id: linked?.id ?? null,
          suggested_vencimento: fx.dia_vencimento
            ? `${competencia.ano}-${String(competencia.mes).padStart(2, "0")}-${String(fx.dia_vencimento).padStart(2, "0")}`
            : null,
        }
      })
  }
  const qs = new URLSearchParams({
    competencia_mes: String(competencia.mes),
    competencia_ano: String(competencia.ano),
  })
  return apiRequest(`/finance/fixed-expenses/launch-status?${qs}`, { auth: true })
}

export async function launchPendingFixedExpenses(
  competencia: { mes: number; ano: number },
): Promise<LaunchPendingResult> {
  if (shouldUseMocks()) {
    const pending = await getFixedExpenseLaunchStatus(competencia)
    let launched_count = 0
    for (const item of pending.filter((p) => !p.launched_this_month)) {
      await launchFixedExpense(item.id, item.suggested_vencimento ?? undefined)
      launched_count++
    }
    return { launched_count, skipped_count: pending.length - launched_count }
  }
  const qs = new URLSearchParams({
    competencia_mes: String(competencia.mes),
    competencia_ano: String(competencia.ano),
  })
  return apiRequest(`/finance/fixed-expenses/launch-pending?${qs}`, { method: "POST", auth: true })
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

/** Valor mensal equivalente de um gasto fixo ativo. */
export function monthlyEquivalent(fx: FixedExpense): number {
  if (!isFixedExpenseActive(fx)) return 0
  switch (fx.frequencia) {
    case "mensal":      return fx.valor
    case "trimestral":  return fx.valor / 3
    case "semestral":   return fx.valor / 6
    case "anual":       return fx.valor / 12
  }
}
