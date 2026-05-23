import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import * as mock from "@/lib/mocks/handlers"
import type { FreightCost, Paginated } from "@/types"

export interface FuelRefill {
  id: string
  freight_id: string
  driver_id: string
  truck_id: string | null
  litros: number
  valor_total: number
  valor_litro: number | null
  km_atual: number | null
  posto: string | null
  cidade: string | null
  estado: string | null
  freight_cost_id: string | null
  freight_code?: string
  created_at: string
}

export interface FuelRefillCreate {
  freight_id: string
  driver_id?: string
  litros: number
  valor_total: number
  posto?: string
  cidade?: string
  estado?: string
  observacoes?: string
}

export async function registerFuelRefill(data: FuelRefillCreate): Promise<FuelRefill> {
  if (shouldUseMocks()) return mock.mockRegisterFuelRefill(data)
  return apiRequest("/fuel", {
    method: "POST",
    body: {
      freight_id: data.freight_id,
      driver_id: data.driver_id,
      litros: data.litros,
      valor_total: data.valor_total,
      posto: data.posto,
      cidade: data.cidade,
      estado: data.estado,
      observacoes: data.observacoes,
    },
    auth: true,
  })
}

export async function listFuelRefillsByFreight(
  freightId: string,
  page = 1,
  size = 50,
): Promise<Paginated<FuelRefill>> {
  if (shouldUseMocks()) return mock.mockListFuelRefills(page, size, freightId)
  return apiRequest(`/fuel/freight/${freightId}?page=${page}&size=${size}`, { auth: true })
}

export async function listAllFuelRefills(page = 1, size = 100): Promise<FuelRefill[]> {
  if (shouldUseMocks()) {
    const res = await mock.mockListFuelRefills(page, size)
    return res.items
  }
  const freights = await import("@/lib/api/services/freight").then((m) => m.listFreights(1, 100))
  const all: FuelRefill[] = []
  for (const f of freights.items) {
    try {
      const page = await listFuelRefillsByFreight(f.id, 1, size)
      all.push(...page.items)
    } catch {
      /* frete sem abastecimentos */
    }
  }
  return all.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}

/** Converte abastecimento para linha da tabela de custos (compat). */
export function fuelRefillToCostRow(refill: FuelRefill): FreightCost {
  return {
    id: refill.freight_cost_id ?? refill.id,
    freight_id: refill.freight_id,
    tipo: "combustivel",
    valor: refill.valor_total,
    litros: refill.litros,
    descricao: refill.posto
      ? `${refill.posto}${refill.cidade ? ` · ${refill.cidade}` : ""}`
      : "Abastecimento",
    created_at: refill.created_at,
  }
}
