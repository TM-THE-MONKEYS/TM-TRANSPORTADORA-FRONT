import type { AuthUser, Driver } from "@/types"

type DriverWithLink = Driver & { user_id?: string | null; email?: string | null }

/** Vincula usuário autenticado ao registro de motorista (API user_id, e-mail ou id). */
export function resolveDriverIdForUser(
  user: AuthUser,
  drivers: Driver[],
): string | null {
  const extended = user as AuthUser & { driver_id?: string | null }
  if (extended.driver_id) return extended.driver_id

  const linked = (drivers as DriverWithLink[]).find((d) => d.user_id === user.id)
  if (linked) return linked.id

  const byEmail = (drivers as DriverWithLink[]).find(
    (d) => d.email?.toLowerCase() === user.email.toLowerCase(),
  )
  if (byEmail) return byEmail.id

  if (user.role === "motorista") {
    const byId = drivers.find((d) => d.id === user.id)
    if (byId) return byId.id
  }

  return null
}
