import type { FreightStatus } from "@/types"

// Labels cobrem também status legados (orcamento/confirmado/em_coleta) que
// ainda podem existir em dados antigos, mas não são mais selecionáveis.
export const FREIGHT_STATUS_LABELS: Record<FreightStatus, string> = {
  orcamento: "Orçamento",
  confirmado: "Confirmado",
  em_coleta: "Em Coleta",
  em_transporte: "Em Transporte",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

export const FREIGHT_STATUS_FLOW: FreightStatus[] = ["em_transporte", "entregue"]

/** Status selecionáveis no fluxo atual da aplicação. */
export const FREIGHT_STATUS_OPTIONS: FreightStatus[] = [
  "em_transporte",
  "entregue",
  "cancelado",
]

export function nextFreightStatus(current: FreightStatus): FreightStatus | null {
  const idx = FREIGHT_STATUS_FLOW.indexOf(current)
  if (idx < 0 || idx >= FREIGHT_STATUS_FLOW.length - 1) return null
  return FREIGHT_STATUS_FLOW[idx + 1]
}

import { freightStatusSoft } from "@/lib/ui/status-colors"

/** Classes soft (badge) — delega ao mapa único em `lib/ui/status-colors`. */
export const FREIGHT_STATUS_COLORS: Record<FreightStatus, string> = {
  orcamento: freightStatusSoft("orcamento"),
  confirmado: freightStatusSoft("confirmado"),
  em_coleta: freightStatusSoft("em_coleta"),
  em_transporte: freightStatusSoft("em_transporte"),
  entregue: freightStatusSoft("entregue"),
  cancelado: freightStatusSoft("cancelado"),
}
