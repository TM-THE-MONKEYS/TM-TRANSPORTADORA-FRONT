import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import {
  mapFreightCostFromApi,
  mapTrackingUpdateToFreightEvent,
  toFreightCreatePayload,
  toFreightUpdatePayload,
} from "@/lib/api/adapters/freights"
import {
  formatOccurrenceObservation,
  parseOccurrenceFromTracking,
  trackingUpdatesToOccurrences,
  trackingUpdatesWithoutOccurrences,
} from "@/lib/freight/occurrences"
import { addTrackingUpdate, getTrackingTimeline } from "@/lib/api/services/tracking"
import { mergeFreightCostsWithFuel } from "@/lib/freight/freight-expenses"
import {
  revalidateFleetAndFreightCaches,
  syncTruckStatusForFreight,
} from "@/lib/freight/sync-fleet-status"
import { listFuelRefillsByFreight } from "@/lib/api/services/fuel"
import * as mock from "@/lib/mocks/handlers"
import type {
  FreightCost,
  FreightEvent,
  FreightOccurrence,
  FreightOrder,
  FreightStatus,
  Paginated,
} from "@/types"

export async function listFreights(page = 1, pageSize = 20): Promise<Paginated<FreightOrder>> {
  if (shouldUseMocks()) return mock.mockListFreights(page, pageSize)
  return apiRequest(`/freights?page=${page}&size=${pageSize}`, { auth: true })
}

export async function getFreight(id: string): Promise<FreightOrder> {
  if (shouldUseMocks()) {
    const f = await mock.mockGetFreight(id)
    if (!f) throw new Error("Frete não encontrado")
    return f
  }
  return apiRequest(`/freights/${id}`, { auth: true })
}

export async function createFreight(
  data: Omit<FreightOrder, "id" | "code" | "created_at" | "updated_at" | "tenant_id">,
): Promise<FreightOrder> {
  if (shouldUseMocks()) return mock.mockCreateFreight(data)
  return apiRequest("/freights", {
    method: "POST",
    body: toFreightCreatePayload(data),
    auth: true,
  })
}

async function afterFreightMutation(freight: FreightOrder): Promise<FreightOrder> {
  await syncTruckStatusForFreight(freight)
  revalidateFleetAndFreightCaches()
  return freight
}

export async function updateFreight(id: string, data: Partial<FreightOrder>): Promise<FreightOrder> {
  const freight = shouldUseMocks()
    ? await mock.mockUpdateFreight(id, data)
    : await apiRequest<FreightOrder>(`/freights/${id}`, {
        method: "PATCH",
        body: toFreightUpdatePayload(data),
        auth: true,
      })
  if (data.status !== undefined || data.truck_id !== undefined) {
    return afterFreightMutation(freight)
  }
  revalidateFleetAndFreightCaches()
  return freight
}

export async function advanceFreightStatus(id: string): Promise<FreightOrder> {
  const freight = shouldUseMocks()
    ? await mock.mockAdvanceFreightStatus(id)
    : await apiRequest<FreightOrder>(`/freights/${id}/advance-status`, { method: "POST", auth: true })
  return afterFreightMutation(freight)
}

export async function updateFreightStatus(id: string, status: FreightStatus): Promise<FreightOrder> {
  const freight = shouldUseMocks()
    ? await mock.mockUpdateFreightStatus(id, status)
    : await apiRequest<FreightOrder>(`/freights/${id}/status`, {
        method: "PATCH",
        body: { status },
        auth: true,
      })
  return afterFreightMutation(freight)
}

export async function deleteFreight(id: string): Promise<void> {
  if (shouldUseMocks()) {
    await mock.mockDeleteFreight(id)
    revalidateFleetAndFreightCaches()
    return
  }
  await apiRequest(`/freights/${id}`, { method: "DELETE", auth: true })
  revalidateFleetAndFreightCaches()
}

/** Timeline operacional (sem ocorrências — estas ficam na aba dedicada). */
export async function getFreightEvents(freightId: string): Promise<FreightEvent[]> {
  if (shouldUseMocks()) return mock.mockListFreightEvents(freightId)
  const timeline = await getTrackingTimeline(freightId)
  const updates = trackingUpdatesWithoutOccurrences(timeline.updates ?? [])
  return updates.map(mapTrackingUpdateToFreightEvent)
}

/** Ocorrências persistidas em tracking (tag [[ocorrencia:tipo]]). */
export async function getFreightOccurrences(freightId: string): Promise<FreightOccurrence[]> {
  if (shouldUseMocks()) return mock.mockFreightOccurrences(freightId)
  const timeline = await getTrackingTimeline(freightId)
  return trackingUpdatesToOccurrences(timeline.updates ?? [])
}

export async function addOccurrence(
  freightId: string,
  type: string,
  description: string,
): Promise<FreightOccurrence> {
  if (shouldUseMocks()) return mock.mockAddOccurrence(freightId, type, description)

  const update = await addTrackingUpdate({
    freight_id: freightId,
    status: "em_transito",
    observacao: formatOccurrenceObservation(type, description),
  })
  const parsed = parseOccurrenceFromTracking(update)
  if (parsed) return parsed
  return {
    id: update.id,
    freight_id: freightId,
    type,
    description,
    created_at: update.evento_at ?? update.created_at,
  }
}

export { listClients as listCustomers, findOrCreateClientByName } from "@/lib/api/services/clients"

export async function listFreightCosts(tipo = "combustivel"): Promise<FreightCost[]> {
  if (shouldUseMocks()) return mock.mockListFreightCosts(tipo)
  return []
}

async function listFreightCostsFromApi(freightId: string): Promise<FreightCost[]> {
  const rows = await apiRequest<Record<string, unknown>[]>(`/freights/${freightId}/costs`, {
    auth: true,
  })
  return rows.map((row) => mapFreightCostFromApi(row, freightId))
}

/** Custos (`tm_freight_costs`) + abastecimentos (`tm_fuel_refills`) — inclui fretes entregues. */
export async function getFreightCosts(freightId: string): Promise<FreightCost[]> {
  if (shouldUseMocks()) return mock.mockGetFreightCosts(freightId)

  const [apiCosts, fuelPage] = await Promise.all([
    listFreightCostsFromApi(freightId).catch(() => [] as FreightCost[]),
    listFuelRefillsByFreight(freightId, 1, 100).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      page_size: 100,
      pages: 0,
    })),
  ])

  return mergeFreightCostsWithFuel(apiCosts, fuelPage.items)
}

export async function addFreightCost(
  freightId: string,
  data: { tipo: string; valor: number; litros?: number; descricao?: string },
): Promise<FreightCost> {
  if (shouldUseMocks()) return mock.mockAddFreightCost(freightId, data)

  const body: Record<string, unknown> = {
    tipo: data.tipo,
    valor: data.valor,
    descricao: data.descricao ?? null,
  }
  if (data.litros != null && data.litros > 0) body.litros = data.litros

  const created = await apiRequest<{
    id: string
    tipo: string
    valor: number
    descricao: string | null
    litros?: number | null
    created_at: string
  }>(`/freights/${freightId}/costs`, {
    method: "POST",
    body,
    auth: true,
  })

  return {
    id: created.id,
    freight_id: freightId,
    tipo: created.tipo,
    valor: created.valor,
    litros: created.litros ?? data.litros ?? null,
    descricao: created.descricao,
    created_at: created.created_at,
  }
}
