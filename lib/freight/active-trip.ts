import type { Driver, FreightOrder, FreightStatus, Truck } from "@/types"

/** Status em que a viagem está em percurso (coleta ou transporte). */
export const IN_TRANSIT_FREIGHT_STATUSES: FreightStatus[] = ["em_coleta", "em_transporte"]

/** Status ativos em que o motorista pode iniciar a viagem (KM inicial). */
export const TRIP_START_ELIGIBLE_STATUSES: FreightStatus[] = [
  "confirmado",
  "em_coleta",
  "em_transporte",
]

export function isFreightInTransit(status: FreightStatus): boolean {
  return IN_TRANSIT_FREIGHT_STATUSES.includes(status)
}

/**
 * Viagem já iniciada (KM inicial registrado).
 * Listagem sem o campo trata como pendente (`undefined` → não iniciada).
 */
export function isTripStarted(freight: Pick<FreightOrder, "km_inicial">): boolean {
  return freight.km_inicial != null
}

export function needsTripStart(freight: Pick<FreightOrder, "status" | "km_inicial">): boolean {
  return (
    TRIP_START_ELIGIBLE_STATUSES.includes(freight.status) && !isTripStarted(freight)
  )
}

export function findActiveFreightByDriver(
  freights: FreightOrder[],
  driverId: string,
): FreightOrder | undefined {
  return freights.find(
    (f) =>
      f.driver_id === driverId &&
      isFreightInTransit(f.status) &&
      isTripStarted(f),
  )
}

export function findActiveFreightByTruck(
  freights: FreightOrder[],
  truckId: string,
): FreightOrder | undefined {
  return freights.find(
    (f) =>
      f.truck_id === truckId &&
      isFreightInTransit(f.status) &&
      isTripStarted(f),
  )
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
