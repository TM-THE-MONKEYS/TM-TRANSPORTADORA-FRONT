import { mutate } from "swr"
import {
  mapTollChargeFromApi,
  mapTollChargePageFromApi,
  mapEligibleFreightFromApi,
  mapTollChargeSummaryFromApi,
} from "@/lib/api/adapters/tolls"
import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import { revalidateTollCaches } from "@/lib/toll/cache"
import type { FreightCost, Paginated } from "@/types"

const MAX_PAGE_SIZE = 100

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface TollCharge {
  id: string
  freight_id: string
  driver_id: string
  registrado_por_user_id: string | null
  freight_cost_id: string | null
  valor: number
  quantidade: number
  praca: string | null
  rodovia: string | null
  cidade: string | null
  estado: string | null
  observacoes: string | null
  data_pedagio: string
  created_at: string
  freight_code?: string
  driver_name?: string
}

export interface TollChargeCreate {
  freightId: string
  value: number
  count?: number
  plaza?: string
  highway?: string
  city?: string
  state?: string
  notes?: string
  tollDate?: string
}

export interface TollChargeSummary {
  freightId: string
  freightCode: string | null
  status: string
  driverId: string | null
  driverName: string | null
  totalValor: number
  totalQuantidade: number
  chargesCount: number
}

export interface EligibleFreightItem {
  freightId: string
  freightCode: string
  status: string
  driverId: string
  driverName: string
  truckId: string | null
  truckPlate: string | null
  originCity: string
  originState: string
  destinationCity: string
  destinationState: string
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function registerToll(data: TollChargeCreate): Promise<TollCharge> {
  if (shouldUseMocks()) {
    return _mockRegisterToll(data)
  }

  const created = mapTollChargeFromApi(
    (await apiRequest<Record<string, unknown>>("/tolls", {
      method: "POST",
      body: {
        freightId: data.freightId,
        value: data.value,
        count: data.count ?? 1,
        plaza: data.plaza,
        highway: data.highway,
        city: data.city,
        state: data.state,
        notes: data.notes,
        tollDate: data.tollDate ?? new Date().toISOString(),
      },
      auth: true,
    })) as Record<string, unknown>,
  )

  revalidateTollCaches(data.freightId)
  return created
}

export async function listTollsByFreight(
  freightId: string,
  page = 1,
  size = 50,
): Promise<Paginated<TollCharge>> {
  const safeSize = Math.min(size, MAX_PAGE_SIZE)

  if (shouldUseMocks()) {
    return { items: [], total: 0, page, page_size: safeSize, pages: 0 }
  }

  const res = await apiRequest<Paginated<Record<string, unknown>>>(
    `/tolls/freight/${freightId}?page=${page}&size=${safeSize}`,
    { auth: true },
  )
  return {
    ...res,
    items: mapTollChargePageFromApi(res),
    page_size: res.page_size ?? safeSize,
  }
}

export async function getTollSummaryByFreight(
  freightId: string,
): Promise<TollChargeSummary | null> {
  if (shouldUseMocks()) {
    return {
      freightId,
      freightCode: null,
      status: "",
      driverId: null,
      driverName: null,
      totalValor: 0,
      totalQuantidade: 0,
      chargesCount: 0,
    }
  }

  try {
    const raw = await apiRequest<Record<string, unknown>>(
      `/tolls/freight/${freightId}/summary`,
      { auth: true },
    )
    return mapTollChargeSummaryFromApi(raw)
  } catch {
    return null
  }
}

export async function listAllTolls(page = 1, size = 100): Promise<TollCharge[]> {
  const safeSize = Math.min(size, MAX_PAGE_SIZE)

  if (shouldUseMocks()) return []

  try {
    const collected: TollCharge[] = []
    let currentPage = page

    while (currentPage <= 50) {
      const res = await apiRequest<Paginated<Record<string, unknown>>>(
        `/tolls?page=${currentPage}&size=${safeSize}`,
        { auth: true },
      )
      const items = mapTollChargePageFromApi(res)
      collected.push(...items)
      if (!res.has_next) break
      currentPage++
    }

    return collected.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  } catch {
    return []
  }
}

export async function listEligibleFreights(): Promise<EligibleFreightItem[]> {
  if (shouldUseMocks()) return []

  try {
    const raw = await apiRequest<unknown[]>("/tolls/eligible-freights", { auth: true })
    if (!Array.isArray(raw)) return []
    return raw.map((item) => mapEligibleFreightFromApi(item as Record<string, unknown>))
  } catch {
    return []
  }
}

export async function getActiveFreight(): Promise<EligibleFreightItem | null> {
  if (shouldUseMocks()) return null

  try {
    const raw = await apiRequest<Record<string, unknown>>("/tolls/active-freight", {
      auth: true,
    })
    return mapEligibleFreightFromApi(raw)
  } catch {
    return null
  }
}

/** Invalida caches de pedágio (após registrar). */
export function invalidateTollListCaches(): void {
  revalidateTollCaches()
  void mutate("toll-list-all")
}

/** Converte pedágio para linha da tabela de custos (compat com FreightExpensesList). */
export function tollToCostRow(toll: TollCharge): FreightCost {
  const descParts: string[] = []
  if (toll.praca) descParts.push(toll.praca)
  if (toll.rodovia) descParts.push(toll.rodovia)
  if (toll.cidade) descParts.push(toll.cidade)

  return {
    id: toll.freight_cost_id ?? toll.id,
    freight_id: toll.freight_id,
    tipo: "PEDAGIO",
    valor: toll.valor,
    descricao:
      descParts.length > 0
        ? `${descParts.join(" · ")} (${toll.quantidade}x)`
        : `Pedágio (${toll.quantidade}x praça${toll.quantidade > 1 ? "s" : ""})`,
    created_at: toll.data_pedagio,
  }
}

// ── Mock fallback ─────────────────────────────────────────────────────────────

function _mockRegisterToll(data: TollChargeCreate): TollCharge {
  return {
    id: `toll-mock-${Date.now()}`,
    freight_id: data.freightId,
    driver_id: "mock-driver",
    registrado_por_user_id: null,
    freight_cost_id: null,
    valor: data.value,
    quantidade: data.count ?? 1,
    praca: data.plaza ?? null,
    rodovia: data.highway ?? null,
    cidade: data.city ?? null,
    estado: data.state ?? null,
    observacoes: data.notes ?? null,
    data_pedagio: data.tollDate ?? new Date().toISOString(),
    created_at: new Date().toISOString(),
  }
}
