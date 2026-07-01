import type { AuthUser, FreightOrder, FreightStatus } from "@/types"

/** Fretes encerrados — não aceitam novo abastecimento. */
export const FUEL_CLOSED_FREIGHT_STATUSES: FreightStatus[] = ["entregue", "cancelado"]

export function isFreightOpenForFuel(status: FreightStatus): boolean {
  return !FUEL_CLOSED_FREIGHT_STATUSES.includes(status)
}

export function filterFreightsForFuel(
  freights: FreightOrder[],
  options?: { driverId?: string | null; includeClosed?: boolean },
): FreightOrder[] {
  let list = freights.filter((f) => {
    if (!Boolean(f.driver_id)) return false
    if (options?.includeClosed) return true
    return isFreightOpenForFuel(f.status)
  })
  if (options?.driverId) {
    list = list.filter((f) => f.driver_id === options.driverId)
  }
  return list
}

export function canRegisterFuelForFreight(
  freight: FreightOrder,
  driverId: string,
  options?: { adminOverride?: boolean },
): boolean {
  if (options?.adminOverride) {
    return Boolean(freight.driver_id)
  }
  return canDriverRefuelFreight(freight, driverId)
}

export function canDriverRefuelFreight(freight: FreightOrder, driverId: string): boolean {
  return (
    isFreightOpenForFuel(freight.status) &&
    freight.driver_id === driverId
  )
}

export function isMotoristaRole(user: AuthUser | null | undefined): boolean {
  return user?.role === "motorista"
}
