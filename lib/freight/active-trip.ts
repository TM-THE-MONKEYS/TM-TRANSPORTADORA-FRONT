import type { Driver, FreightOrder, FreightStatus, Truck } from "@/types"

/** Status em que a viagem está em percurso (coleta ou transporte). */
export const IN_TRANSIT_FREIGHT_STATUSES: FreightStatus[] = ["em_coleta", "em_transporte"]

export function isFreightInTransit(status: FreightStatus): boolean {
  return IN_TRANSIT_FREIGHT_STATUSES.includes(status)
}

export function findActiveFreightByDriver(
  freights: FreightOrder[],
  driverId: string,
): FreightOrder | undefined {
  return freights.find((f) => f.driver_id === driverId && isFreightInTransit(f.status))
}

export function findActiveFreightByTruck(
  freights: FreightOrder[],
  truckId: string,
): FreightOrder | undefined {
  return freights.find((f) => f.truck_id === truckId && isFreightInTransit(f.status))
}

export function getDriverName(drivers: Driver[], id?: string | null): string | undefined {
  if (!id) return undefined
  return drivers.find((d) => d.id === id)?.name
}

export function getTruckLabel(trucks: Truck[], id?: string | null): string | undefined {
  if (!id) return undefined
  const t = trucks.find((x) => x.id === id)
  return t ? `${t.plate} · ${t.brand} ${t.model}` : undefined
}
