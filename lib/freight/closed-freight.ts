import { FREIGHT_STATUS_FLOW, FREIGHT_STATUS_LABELS } from "@/lib/freight/status"
import { isAdminRole } from "@/lib/rbac/permissions"
import type { FreightStatus, UserRole } from "@/types"

export const CLOSED_FREIGHT_STATUSES: FreightStatus[] = ["entregue", "cancelado"]

export function isFreightClosed(status: FreightStatus): boolean {
  return CLOSED_FREIGHT_STATUSES.includes(status)
}

export function canAdminManageClosedFreight(role: UserRole | string | undefined): boolean {
  return isAdminRole(role)
}

/** Status sugerido ao reabrir um frete encerrado (passo anterior no fluxo). */
export function suggestedRevertStatus(current: FreightStatus): FreightStatus | null {
  if (current === "entregue") return "em_transporte"
  if (current === "cancelado") return "orcamento"
  return null
}

export const ADMIN_FREIGHT_STATUS_OPTIONS = (
  Object.entries(FREIGHT_STATUS_LABELS) as [FreightStatus, string][]
).map(([value, label]) => ({ value, label }))

export function isStatusInFlow(status: FreightStatus): boolean {
  return FREIGHT_STATUS_FLOW.includes(status)
}
