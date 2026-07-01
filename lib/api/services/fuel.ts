import { mutate } from "swr"
import { mapFuelRefillFromApi, mapFuelRefillPageFromApi } from "@/lib/api/adapters/fuel"
import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import { revalidateFuelCaches } from "@/lib/fuel/cache"
import * as mock from "@/lib/mocks/handlers"
import type { FreightCost, Paginated } from "@/types"

const MAX_PAGE_SIZE = 100

export interface FuelRefill {
  id: string
  freight_id: string
  driver_id: string | null
  driver_name?: string | null
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
  km_atual?: number
  posto?: string
  cidade?: string
  estado?: string
  observacoes?: string
  /** Admin: permite abastecimento em frete entregue/cancelado. */
  admin_override?: boolean
}

export async function registerFuelRefill(data: FuelRefillCreate): Promise<FuelRefill> {
  const created = shouldUseMocks()
    ? await mock.mockRegisterFuelRefill(data)
    : mapFuelRefillFromApi(
        (await apiRequest<Record<string, unknown>>("/fuel", {
          method: "POST",
          body: {
            freight_id: data.freight_id,
            driver_id: data.driver_id,
            litros: data.litros,
            valor_total: data.valor_total,
            km_atual: data.km_atual,
            posto: data.posto,
            cidade: data.cidade,
            estado: data.estado,
            observacoes: data.observacoes,
            admin_override: data.admin_override,
          },
          auth: true,
        })) as Record<string, unknown>,
      )

  revalidateFuelCaches(data.freight_id)
  return created
}

export async function listFuelRefillsByFreight(
  freightId: string,
  page = 1,
  size = 50,
): Promise<Paginated<FuelRefill>> {
  const safeSize = Math.min(size, MAX_PAGE_SIZE)
  if (shouldUseMocks()) return mock.mockListFuelRefills(page, safeSize, freightId)

  const res = await apiRequest<Paginated<Record<string, unknown>>>(
    `/fuel/freight/${freightId}?page=${page}&size=${safeSize}`,
    { auth: true },
  )
  return {
    ...res,
    items: mapFuelRefillPageFromApi(res),
    page_size: res.page_size ?? safeSize,
  }
}

function sortFuelRefillsNewestFirst(items: FuelRefill[]): FuelRefill[] {
  return [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}

async function fetchFuelRefillsPage(
  page: number,
  size: number,
): Promise<Paginated<FuelRefill>> {
  const res = await apiRequest<Paginated<Record<string, unknown>>>(
    `/fuel?page=${page}&size=${size}`,
    { auth: true },
  )
  return {
    ...res,
    items: mapFuelRefillPageFromApi(res),
    page_size: res.page_size ?? size,
  }
}

/** Agrega abastecimentos de todos os fretes (fallback se GET /fuel indisponível). */
async function listFuelRefillsAggregatedByFreights(size: number): Promise<FuelRefill[]> {
  const { listFreights } = await import("@/lib/api/services/freight")
  const byId = new Map<string, FuelRefill>()
  let freightPage = 1

  while (freightPage <= 50) {
    const freights = await listFreights(freightPage, size)
    if (freights.items.length === 0) break

    const batches = await Promise.all(
      freights.items.map((f) =>
        listFuelRefillsByFreight(f.id, 1, size)
          .then((p) => p.items)
          .catch(() => [] as FuelRefill[]),
      ),
    )
    for (const items of batches) {
      for (const item of items) byId.set(item.id, item)
    }

    if (!freights.has_next && freights.items.length < size) break
    freightPage++
  }

  return sortFuelRefillsNewestFirst([...byId.values()])
}

/** Histórico geral — origem: `tm_fuel_refills` via GET /api/v1/fuel. */
export async function listAllFuelRefills(page = 1, size = 100): Promise<FuelRefill[]> {
  const safeSize = Math.min(size, MAX_PAGE_SIZE)

  if (shouldUseMocks()) {
    const res = await mock.mockListFuelRefills(page, safeSize)
    return res.items
  }

  try {
    const collected: FuelRefill[] = []
    let currentPage = page

    while (currentPage <= 50) {
      const batch = await fetchFuelRefillsPage(currentPage, safeSize)
      collected.push(...batch.items)
      if (!batch.has_next) break
      currentPage++
    }

    return sortFuelRefillsNewestFirst(collected)
  } catch {
    return listFuelRefillsAggregatedByFreights(safeSize)
  }
}

/** Invalida listagens de abastecimento (após registrar). */
export function invalidateFuelListCaches(): void {
  revalidateFuelCaches()
  void mutate("fuel-refills-all")
  void mutate("reports-fuel-refills")
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
