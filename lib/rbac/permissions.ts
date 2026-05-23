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

export function isAdminRole(role: UserRole | string | undefined): boolean {
  if (!role) return false
  const r = String(role).toLowerCase()
  return r === "admin" || r === "administrador"
}

/** Permissões efetivas = papel + lista retornada pela API. */
export function mergeUserPermissions(
  role: UserRole,
  apiPermissions?: string[],
): Permission[] {
  const fromRole = permissionsForRole(role)
  const fromApi = (apiPermissions ?? []).filter((p): p is Permission =>
    Object.values(PERMISSIONS).includes(p as Permission),
  )
  return [...new Set([...fromRole, ...fromApi])]
}

export function hasPermission(
  userPermissions: string[] | undefined,
  role: UserRole,
  permission: Permission,
): boolean {
  if (isAdminRole(role)) return true
  if (userPermissions?.includes(PERMISSIONS.tenantAdmin)) return true
  if (userPermissions?.includes(permission)) return true
  return permissionsForRole(role).includes(permission)
}

export function canAccessRoute(
  pathname: string,
  role: UserRole,
  userPermissions?: string[],
): boolean {
  if (isAdminRole(role)) return true

  const match = Object.entries(ROUTE_PERMISSIONS).find(
    ([route]) => pathname === route || pathname.startsWith(`${route}/`),
  )
  if (!match) return true
  const [, permission] = match
  return hasPermission(userPermissions, role, permission)
}

export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/dashboard": PERMISSIONS.dashboard,
  "/dashboard/frota": PERMISSIONS.fleetRead,
  "/dashboard/motoristas": PERMISSIONS.driversRead,
  "/dashboard/fretes": PERMISSIONS.freightRead,
  "/dashboard/financeiro": PERMISSIONS.financeRead,
  "/dashboard/abastecimento": PERMISSIONS.freightRead,
  "/dashboard/manutencao": PERMISSIONS.fleetRead,
  "/dashboard/rastreamento": PERMISSIONS.freightRead,
  "/dashboard/relatorios": PERMISSIONS.dashboard,
}
