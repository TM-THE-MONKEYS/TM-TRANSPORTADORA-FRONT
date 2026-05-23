import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import {
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

export async function updateFreight(id: string, data: Partial<FreightOrder>): Promise<FreightOrder> {
  if (shouldUseMocks()) return mock.mockUpdateFreight(id, data)
  return apiRequest(`/freights/${id}`, {
    method: "PATCH",
    body: toFreightUpdatePayload(data),
    auth: true,
  })
}

export async function advanceFreightStatus(id: string): Promise<FreightOrder> {
  if (shouldUseMocks()) return mock.mockAdvanceFreightStatus(id)
  return apiRequest(`/freights/${id}/advance-status`, { method: "POST", auth: true })
}

export async function updateFreightStatus(id: string, status: FreightStatus): Promise<FreightOrder> {
  if (shouldUseMocks()) return mock.mockUpdateFreightStatus(id, status)
  return apiRequest(`/freights/${id}/status`, {
    method: "PATCH",
    body: { status },
    auth: true,
  })
}

export async function deleteFreight(id: string): Promise<void> {
  if (shouldUseMocks()) return
  await apiRequest(`/freights/${id}`, { method: "DELETE", auth: true })
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
