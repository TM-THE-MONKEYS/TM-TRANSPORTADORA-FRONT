import type { UserRole } from "@/types"

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  operacional: "Operacional",
  operador: "Operador",
  financeiro: "Financeiro",
  motorista: "Motorista",
  cliente: "Cliente",
}

export function getUserRoleLabel(role: UserRole | string | undefined): string {
  if (!role) return "Usuário"
  const normalized = String(role).toLowerCase()
  if (normalized === "administrador") return ROLE_LABELS.admin
  return ROLE_LABELS[normalized as UserRole] ?? "Usuário"
}
