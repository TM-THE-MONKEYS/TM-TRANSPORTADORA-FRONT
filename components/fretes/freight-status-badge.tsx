import { Badge } from "@/components/ui/badge"
import { FREIGHT_STATUS_LABELS } from "@/lib/freight/status"
import type { FreightStatus } from "@/types"

const variantMap: Partial<
  Record<FreightStatus, "default" | "secondary" | "success" | "outline" | "destructive">
> = {
  em_transporte: "default",
  entregue: "success",
  cancelado: "destructive",
}

export function FreightStatusBadge({ status }: { status: FreightStatus }) {
  return (
    <Badge variant={variantMap[status] ?? "secondary"}>
      {FREIGHT_STATUS_LABELS[status]}
    </Badge>
  )
}
