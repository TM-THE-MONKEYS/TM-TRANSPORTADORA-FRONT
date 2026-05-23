import {
  isAdminRole,
  mergeUserPermissions,
  permissionsForRole,
} from "@/lib/rbac/permissions"
import type { AuthUser, UserRole } from "@/types"

const ROLE_ALIASES: Record<string, UserRole> = {
  operador: "operacional",
  operacional: "operacional",
  admin: "admin",
  administrador: "admin",
  financeiro: "financeiro",
  motorista: "motorista",
  cliente: "cliente",
}

/** Normaliza papel e permissões vindos da API (admin com acesso total no front). */
export function normalizeRole(role: string | undefined): UserRole {
  if (!role) return "cliente"
  const key = role.toLowerCase()
  return ROLE_ALIASES[key] ?? "cliente"
}

export function normalizeAuthUser(user: AuthUser): AuthUser {
  const role = normalizeRole(user.role)
  const extended = user as AuthUser & { driver_id?: string | null }

  const permissions = isAdminRole(role)
    ? permissionsForRole("admin")
    : mergeUserPermissions(role, user.permissions)

  return {
    ...user,
    role,
    permissions,
    driver_id: extended.driver_id ?? undefined,
  }
}
