import type { AuthUser, UserRole } from "@/types"

/** Backend retorna `operador`; UI usa `operacional` quando aplicável. */
export function normalizeAuthUser(user: AuthUser): AuthUser {
  const role: UserRole =
    user.role === "operador" ? "operacional" : user.role
  return { ...user, role }
}
