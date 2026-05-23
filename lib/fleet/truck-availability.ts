import { findActiveFreightByTruck } from "@/lib/freight/active-trip"
import type { FreightOrder, Truck, TruckStatus } from "@/types"

const LOCKED_TRUCK_STATUSES: TruckStatus[] = ["em_manutencao", "inativo"]

export const TRUCK_STATUS_LABELS: Record<TruckStatus, string> = {
  disponivel: "Disponível",
  em_viagem: "Em viagem",
  em_manutencao: "Manutenção",
  inativo: "Inativo",
}

/** Status exibido na frota: prioriza viagem ativa (frete em coleta/transporte). */
export function getEffectiveTruckStatus(truck: Truck, freights: FreightOrder[]): TruckStatus {
  if (LOCKED_TRUCK_STATUSES.includes(truck.status)) return truck.status
  if (findActiveFreightByTruck(freights, truck.id)) return "em_viagem"
  if (truck.status === "em_viagem") return "disponivel"
  return truck.status
}

export function truckHasActiveFreight(freights: FreightOrder[], truckId: string): boolean {
  return Boolean(findActiveFreightByTruck(freights, truckId))
}
