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
  const fromApi = (apiPermissions ?? []).filter((p): p is Permission => {
    if (!Object.values(PERMISSIONS).includes(p as Permission)) return false
    // Never elevate via API payload; tenant admin is role-gated server-side.
    if (p === PERMISSIONS.tenantAdmin && !isAdminRole(role)) return false
    return true
  })
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

export type NavRoute = {
  href: string
  label: string
  permission: Permission
}

export const HOME_NAV_ROUTE: NavRoute = {
  href: "/dashboard/home",
  label: "Home",
  permission: PERMISSIONS.dashboard,
}

/** Módulos principais do painel (exclui a própria Home). */
export const DASHBOARD_MODULE_ROUTES: NavRoute[] = [
  { href: "/dashboard", label: "Dashboard", permission: PERMISSIONS.dashboard },
  { href: "/dashboard/fretes", label: "Fretes", permission: PERMISSIONS.freightRead },
  { href: "/dashboard/rastreamento", label: "Rastreamento", permission: PERMISSIONS.freightRead },
  { href: "/dashboard/frota", label: "Frota", permission: PERMISSIONS.fleetRead },
  { href: "/dashboard/motoristas", label: "Motoristas", permission: PERMISSIONS.driversRead },
  { href: "/dashboard/abastecimento", label: "Abastecimento", permission: PERMISSIONS.freightRead },
  { href: "/dashboard/manutencao", label: "Manutenção", permission: PERMISSIONS.fleetRead },
  { href: "/dashboard/financeiro", label: "Financeiro", permission: PERMISSIONS.financeRead },
  { href: "/dashboard/relatorios", label: "Relatórios", permission: PERMISSIONS.financeRead },
]

export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  ...Object.fromEntries(
    DASHBOARD_MODULE_ROUTES.filter((route) => route.href !== "/dashboard").map(
      (route) => [route.href, route.permission],
    ),
  ),
  "/dashboard/motoristas/nova-conta": PERMISSIONS.tenantAdmin,
}

const ROUTE_PERMISSION_ENTRIES = Object.entries(ROUTE_PERMISSIONS).sort(
  ([a], [b]) => b.length - a.length,
)

function permissionForPathname(pathname: string): Permission | null {
  if (pathname === "/dashboard") return PERMISSIONS.dashboard

  const match = ROUTE_PERMISSION_ENTRIES.find(
    ([route]) => pathname === route || pathname.startsWith(`${route}/`),
  )
  return match?.[1] ?? null
}

export function canAccessRoute(
  pathname: string,
  role: UserRole,
  userPermissions?: string[],
): boolean {
  if (pathname.startsWith("/dashboard/conta")) return true
  if (pathname === HOME_NAV_ROUTE.href) return true

  if (isAdminRole(role)) return true

  const permission = permissionForPathname(pathname)
  if (!permission) {
    // Unknown /dashboard/* paths default deny (UI-only RBAC is not a security boundary).
    return false
  }
  return hasPermission(userPermissions, role, permission)
}

/** Rota inicial após login ou quando o guard bloqueia acesso. */
export function getDefaultHomeRoute(
  _role: UserRole,
  _userPermissions?: string[],
): string {
  return HOME_NAV_ROUTE.href
}

export const NAV_ROUTES: NavRoute[] = [HOME_NAV_ROUTE, ...DASHBOARD_MODULE_ROUTES]

export function getAllowedNavRoutes(
  role: UserRole,
  userPermissions?: string[],
): NavRoute[] {
  const modules = isAdminRole(role)
    ? DASHBOARD_MODULE_ROUTES
    : DASHBOARD_MODULE_ROUTES.filter((route) =>
        hasPermission(userPermissions, role, route.permission),
      )

  if (modules.length === 0) return []
  return [HOME_NAV_ROUTE, ...modules]
}
