import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import type { TrackingStatus, TrackingTimeline, TrackingUpdate } from "@/types"

// ── Mock data ────────────────────────────────────────────────────────────────

const mockUpdates: TrackingUpdate[] = [
  {
    id: "trk-1",
    freight_id: "frt-1",
    status: "coletado",
    observacao: "Carga coletada no cliente",
    evento_at: "2026-05-11T08:00:00Z",
    created_at: "2026-05-11T08:05:00Z",
  },
  {
    id: "trk-2",
    freight_id: "frt-1",
    status: "em_transito",
    latitude: -23.5505,
    longitude: -46.6333,
    observacao: "Em rota para Santos SP",
    evento_at: "2026-05-12T06:00:00Z",
    created_at: "2026-05-12T06:05:00Z",
  },
]

// ── Service functions ─────────────────────────────────────────────────────────

export async function getTrackingTimeline(freightId: string): Promise<TrackingTimeline> {
  if (shouldUseMocks()) {
    const updates = mockUpdates.filter((u) => u.freight_id === freightId)
    return { freight_id: freightId, updates }
  }
  return apiRequest(`/tracking/${freightId}/timeline`, { auth: true })
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
    mockUpdates.push(update)
    return update
  }
  return apiRequest("/tracking", { method: "POST", body: data, auth: true })
}
