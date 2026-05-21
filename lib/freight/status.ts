import type { FreightStatus } from "@/types"

export const FREIGHT_STATUS_LABELS: Record<FreightStatus, string> = {
  cotacao: "Cotação",
  aprovacao: "Aprovação",
  embarque: "Embarque",
  em_transito: "Em trânsito",
  entregue: "Entregue",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
}

export const FREIGHT_STATUS_FLOW: FreightStatus[] = [
  "cotacao",
  "aprovacao",
  "embarque",
  "em_transito",
  "entregue",
  "finalizado",
]

export function nextFreightStatus(current: FreightStatus): FreightStatus | null {
  const idx = FREIGHT_STATUS_FLOW.indexOf(current)
  if (idx < 0 || idx >= FREIGHT_STATUS_FLOW.length - 1) return null
  return FREIGHT_STATUS_FLOW[idx + 1]
}
