import { FREIGHT_STATUS_LABELS } from "@/lib/freight/status"
import type { FreightStatus, StatusHistoryEntry } from "@/types"

const SOURCE_LABELS: Record<StatusHistoryEntry["source"], string> = {
  api: "Registro",
  tracking: "Rastreamento",
  system: "Automático",
}

function statusLabel(status: string): string {
  if (status in FREIGHT_STATUS_LABELS) {
    return FREIGHT_STATUS_LABELS[status as FreightStatus]
  }
  return status
}

export function statusChangeTitle(
  entry: Pick<StatusHistoryEntry, "from_status" | "to_status">,
): string {
  const to = statusLabel(entry.to_status)
  if (!entry.from_status) return `Status inicial: ${to}`
  return `${statusLabel(entry.from_status)} para ${to}`
}

export function statusChangeSourceLabel(source: StatusHistoryEntry["source"]): string {
  return SOURCE_LABELS[source]
}
