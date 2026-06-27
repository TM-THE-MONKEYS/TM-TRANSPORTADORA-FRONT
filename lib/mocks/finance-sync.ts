import type { Driver, FinanceEntry, FreightOrder } from "@/types"
import type { FuelRefill } from "@/lib/api/services/fuel"
import {
  DRIVER_COMMISSION_CATEGORY,
  computeDriverCommission,
  driverCommissionDescription,
} from "@/lib/freight/driver-commission"
import { generateId } from "@/lib/mocks/store"

/** Lançamentos financeiros mock (fonte única para `finance.ts`). */
export const mockFinanceEntries: FinanceEntry[] = [
  {
    id: "fin-1",
    tipo: "receita",
    categoria: "Frete",
    descricao: "Frete OF-2026-0001",
    valor: 18500,
    status: "pago",
    freight_id: "frt-1",
    data_vencimento: "2026-05-15",
    created_at: "2026-05-10T08:00:00Z",
    updated_at: "2026-05-15T10:00:00Z",
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

export function ensureMockFreightRevenue(freight: FreightOrder): void {
  const exists = mockFinanceEntries.some(
    (e) => e.freight_id === freight.id && e.tipo === "receita",
  )
  if (exists || freight.value_brl <= 0) return

  mockFinanceEntries.unshift({
    id: generateId("fin"),
    tipo: "receita",
    categoria: "Frete",
    descricao: `Receita frete ${freight.code}`,
    valor: freight.value_brl,
    status: "pendente",
    freight_id: freight.id,
    data_vencimento: freight.deadline_at ?? undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
}

/** Despesa de comissão ao entregar frete com motorista comissionado. */
export function ensureMockDriverCommissionExpense(
  freight: FreightOrder,
  driver: Pick<Driver, "name" | "commission_pct"> | null | undefined,
): boolean {
  if (freight.status !== "entregue") return false
  if (!freight.driver_id || !driver) return false

  const valor = computeDriverCommission(freight.value_brl, driver.commission_pct)
  if (valor == null || valor <= 0) return false

  const exists = mockFinanceEntries.some(
    (e) =>
      e.freight_id === freight.id &&
      e.tipo === "despesa" &&
      e.categoria === DRIVER_COMMISSION_CATEGORY,
  )
  if (exists) return false

  mockFinanceEntries.unshift({
    id: generateId("fin"),
    tipo: "despesa",
    categoria: DRIVER_COMMISSION_CATEGORY,
    descricao: driverCommissionDescription(freight.code, driver.name),
    valor,
    status: "pendente",
    freight_id: freight.id,
    data_vencimento: freight.deadline_at ?? undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  return true
}

export function addMockFuelExpense(refill: FuelRefill, label: string): void {
  mockFinanceEntries.unshift({
    id: generateId("fin"),
    tipo: "despesa",
    categoria: "Combustível",
    descricao: `${label} · ${refill.litros}L`,
    valor: refill.valor_total,
    status: "pago",
    freight_id: refill.freight_id,
    created_at: refill.created_at,
    updated_at: refill.created_at,
  })
}
