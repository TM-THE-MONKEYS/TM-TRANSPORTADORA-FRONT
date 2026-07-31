import {
  FREIGHT_STATUS_FLOW,
  FREIGHT_STATUS_LABELS,
  FREIGHT_STATUS_OPTIONS,
} from "@/lib/freight/status"
import { isAdminRole } from "@/lib/rbac/permissions"
import type { FreightStatus, UserRole } from "@/types"

export const CLOSED_FREIGHT_STATUSES: FreightStatus[] = ["entregue", "cancelado"]

export function isFreightClosed(status: FreightStatus): boolean {
  return CLOSED_FREIGHT_STATUSES.includes(status)
}

export function canAdminManageClosedFreight(role: UserRole | string | undefined): boolean {
  return isAdminRole(role)
}

/** Status sugerido ao reabrir um frete encerrado. */
export function suggestedRevertStatus(current: FreightStatus): FreightStatus | null {
  if (current === "entregue" || current === "cancelado") return "em_transporte"
  return null
}

export const ADMIN_FREIGHT_STATUS_OPTIONS = FREIGHT_STATUS_OPTIONS.map((value) => ({
  value,
  label: FREIGHT_STATUS_LABELS[value],
}))

export function isStatusInFlow(status: FreightStatus): boolean {
  return FREIGHT_STATUS_FLOW.includes(status)
}
