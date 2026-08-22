import { formatOccurrenceObservation } from "@/lib/freight/occurrences"
import type { TrackingUpdate } from "@/types"

/** Mock tracking store — no SWR / client-only imports (safe for App Router). */
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
