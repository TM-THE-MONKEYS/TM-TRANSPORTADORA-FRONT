import type { UserRole } from "@/types"

export const PERMISSIONS = {
  dashboard: "dashboard:read",
  fleetRead: "fleet:read",
  fleetWrite: "fleet:write",
  driversRead: "drivers:read",
  driversWrite: "drivers:write",
  freightRead: "freight:read",
  freightWrite: "freight:write",
  freightStatus: "freight:status",
  financeRead: "finance:read",
  tenantAdmin: "tenant:admin",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

const _OPERACIONAL_PERMISSIONS: Permission[] = [
  PERMISSIONS.dashboard,
  PERMISSIONS.fleetRead,
  PERMISSIONS.fleetWrite,
  PERMISSIONS.driversRead,
  PERMISSIONS.driversWrite,
  PERMISSIONS.freightRead,
  PERMISSIONS.freightWrite,
  PERMISSIONS.freightStatus,
]

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: Object.values(PERMISSIONS),
  operacional: _OPERACIONAL_PERMISSIONS,
  operador: _OPERACIONAL_PERMISSIONS,   // backend uses 'operador'; same permissions as 'operacional'
  financeiro: [PERMISSIONS.dashboard, PERMISSIONS.financeRead, PERMISSIONS.freightRead],
  motorista: [PERMISSIONS.freightRead, PERMISSIONS.freightStatus],
  cliente: [PERMISSIONS.freightRead],
}

export function permissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

export function hasPermission(
  userPermissions: string[] | undefined,
  role: UserRole,
  permission: Permission,
): boolean {
  if (userPermissions?.includes(permission)) return true
  return permissionsForRole(role).includes(permission)
}

export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/dashboard": PERMISSIONS.dashboard,
  "/dashboard/frota": PERMISSIONS.fleetRead,
  "/dashboard/motoristas": PERMISSIONS.driversRead,
  "/dashboard/fretes": PERMISSIONS.freightRead,
}
