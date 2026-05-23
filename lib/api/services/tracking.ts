import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import { formatOccurrenceObservation } from "@/lib/freight/occurrences"
import type { TrackingStatus, TrackingTimeline, TrackingUpdate } from "@/types"

// ── Mock data ────────────────────────────────────────────────────────────────

export const mockTrackingUpdates: TrackingUpdate[] = [
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
  {
    id: "trk-occ-1",
    freight_id: "frt-1",
    status: "em_transito",
    observacao: formatOccurrenceObservation("atraso", "Trânsito na Rod. Anhanguera — 45 min"),
    evento_at: "2026-05-13T10:30:00Z",
    created_at: "2026-05-13T10:30:00Z",
  },
]

// ── Service functions ─────────────────────────────────────────────────────────

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
  return apiRequest("/tracking", {
    method: "POST",
    body: { ...rest, descricao: observacao },
    auth: true,
  }).then((raw) => mapTrackingUpdate(raw as TrackingUpdate & { descricao?: string }))
}
