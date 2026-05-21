import type { FreightStatus } from "@/types"

export const FREIGHT_STATUS_LABELS: Record<FreightStatus, string> = {
  orcamento: "Orçamento",
  confirmado: "Confirmado",
  em_coleta: "Em Coleta",
  em_transporte: "Em Transporte",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

export const FREIGHT_STATUS_FLOW: FreightStatus[] = [
  "orcamento",
  "confirmado",
  "em_coleta",
  "em_transporte",
  "entregue",
]

export function nextFreightStatus(current: FreightStatus): FreightStatus | null {
  const idx = FREIGHT_STATUS_FLOW.indexOf(current)
  if (idx < 0 || idx >= FREIGHT_STATUS_FLOW.length - 1) return null
  return FREIGHT_STATUS_FLOW[idx + 1]
}

export const FREIGHT_STATUS_COLORS: Record<FreightStatus, string> = {
  orcamento: "bg-gray-100 text-gray-700",
  confirmado: "bg-blue-100 text-blue-700",
  em_coleta: "bg-yellow-100 text-yellow-700",
  em_transporte: "bg-orange-100 text-orange-700",
  entregue: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
}
