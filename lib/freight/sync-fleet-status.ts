import { mutate } from "swr"
import { invalidateFinanceCaches } from "@/lib/api/services/finance"
import { getTruck, updateTruck } from "@/lib/api/services/fleet"
import { listFreights } from "@/lib/api/services/freight"
import { shouldUseMocks } from "@/lib/api/config"
import { truckHasActiveFreight } from "@/lib/fleet/truck-availability"
import type { FreightOrder, TruckStatus } from "@/types"

const LOCKED: TruckStatus[] = ["em_manutencao", "inativo"]

/** Atualiza status do caminhão na API conforme fretes ativos (após concluir viagem, etc.). */
export async function syncTruckStatusForFreight(freight: FreightOrder): Promise<void> {
  if (shouldUseMocks()) return
  if (!freight.truck_id) return

  try {
    const truck = await getTruck(freight.truck_id)
    if (LOCKED.includes(truck.status)) return

    const { items } = await listFreights(1, 100)
    const onTrip = truckHasActiveFreight(items, freight.truck_id)
    const next: TruckStatus = onTrip ? "em_viagem" : "disponivel"

    if (truck.status !== next) {
      await updateTruck(freight.truck_id, { status: next })
    }
  } catch {
    // Falha silenciosa — UI ainda usa status efetivo derivado dos fretes
  }
}

export async function syncTruckStatusById(truckId: string): Promise<void> {
  if (shouldUseMocks()) return

  try {
    const truck = await getTruck(truckId)
    if (LOCKED.includes(truck.status)) return

    const { items } = await listFreights(1, 100)
    const onTrip = truckHasActiveFreight(items, truckId)
    const next: TruckStatus = onTrip ? "em_viagem" : "disponivel"

    if (truck.status !== next) {
      await updateTruck(truckId, { status: next })
    }
  } catch {
    // noop
  }
}

export function revalidateFleetAndFreightCaches(): void {
  void mutate((key) => {
    if (
      key === "op-freights" ||
      key === "op-trucks" ||
      key === "freights-list" ||
      key === "reports-fuel-refills" ||
      key === "reports-recent-freights" ||
      key === "reports-kpis" ||
      key === "cash-flow"
    ) {
      return true
    }
    if (Array.isArray(key) && key[0] === "finance-entries") return true
    if (Array.isArray(key)) {
      const head = key[0]
      if (
        head === "trucks" ||
        head === "truck" ||
        head === "freight" ||
        head === "freight-expenses" ||
        head === "report-freight" ||
        head === "report-freight-costs" ||
        head === "report-freight-finance"
      ) {
        return true
      }
    }
    return false
  })
  invalidateFinanceCaches()
}
