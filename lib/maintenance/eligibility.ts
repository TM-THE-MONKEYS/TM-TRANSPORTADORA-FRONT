import { truckHasActiveFreight } from "@/lib/fleet/truck-availability"
import type { FreightOrder, Truck } from "@/types"

/** Caminhões elegíveis para agendar manutenção (não inativo, sem frete em trânsito). */
export function filterTrucksForMaintenance(trucks: Truck[], freights: FreightOrder[]): Truck[] {
  return trucks.filter((t) => {
    if (t.status === "inativo") return false
    if (truckHasActiveFreight(freights, t.id)) return false
    return true
  })
}
