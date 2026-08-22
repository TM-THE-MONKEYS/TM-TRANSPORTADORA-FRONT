import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import { mockTrackingUpdates } from "@/lib/mocks/tracking-data"
import type { TrackingStatus, TrackingTimeline, TrackingUpdate } from "@/types"

export { mockTrackingUpdates } from "@/lib/mocks/tracking-data"

function mapTrackingUpdate(raw: TrackingUpdate & { descricao?: string }): TrackingUpdate {
  return {
    ...raw,
    observacao: raw.observacao ?? raw.descricao,
  }
}

export async function getTrackingTimeline(freightId: string): Promise<TrackingTimeline> {
  if (shouldUseMocks()) {
    const updates = mockTrackingUpdates.filter((u) => u.freight_id === freightId)
    return { freight_id: freightId, updates }
  }
  const res = await apiRequest<TrackingTimeline>(`/tracking/${freightId}/timeline`, { auth: true })
  return {
    ...res,
    updates: (res.updates ?? []).map((u) => mapTrackingUpdate(u as TrackingUpdate & { descricao?: string })),
  }
}

export async function addTrackingUpdate(data: {
  freight_id: string
  status: TrackingStatus
  latitude?: number
  longitude?: number
  observacao?: string
  evento_at?: string
}): Promise<TrackingUpdate> {
  if (shouldUseMocks()) {
    const update: TrackingUpdate = {
      id: `trk-${Date.now()}`,
      freight_id: data.freight_id,
      status: data.status,
      latitude: data.latitude,
      longitude: data.longitude,
      observacao: data.observacao,
      evento_at: data.evento_at ?? new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    mockTrackingUpdates.push(update)
    return update
  }
  const { observacao, ...rest } = data
  const update = await apiRequest("/tracking", {
    method: "POST",
    body: { ...rest, descricao: observacao },
    auth: true,
  }).then((raw) => mapTrackingUpdate(raw as TrackingUpdate & { descricao?: string }))

  // Tracking "entregue" conclui o frete no backend — invalida caches.
  if (data.status === "entregue") {
    const { revalidateFleetAndFreightCaches } = await import("@/lib/freight/sync-fleet-status")
    revalidateFleetAndFreightCaches()
  }
  return update
}
