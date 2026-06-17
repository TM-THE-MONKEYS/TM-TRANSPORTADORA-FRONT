import { getTruck, updateTruck } from "@/lib/api/services/fleet"
import { listFreights } from "@/lib/api/services/freight"
import { truckHasActiveFreight } from "@/lib/fleet/truck-availability"
import type { MaintenanceStatus } from "@/types"

export async function setTruckInMaintenance(truckId: string): Promise<void> {
  const truck = await getTruck(truckId)
  if (truck.status === "inativo") {
    throw new Error("Veículo inativo não pode entrar em manutenção")
  }
  if (truck.status !== "em_manutencao") {
    await updateTruck(truckId, { status: "em_manutencao" })
  }
}

export async function releaseTruckAfterMaintenance(truckId: string): Promise<void> {
  const truck = await getTruck(truckId)
  if (truck.status === "inativo") return

  const { items } = await listFreights(1, 100)
  const onTrip = truckHasActiveFreight(items, truckId)
  const next = onTrip ? "em_viagem" : "disponivel"

  if (truck.status !== next) {
    await updateTruck(truckId, { status: next })
  }
}

export async function syncTruckForMaintenanceStatus(
  truckId: string,
  status: MaintenanceStatus,
  previousStatus?: MaintenanceStatus,
): Promise<void> {
  if (status === "em_andamento") {
    await setTruckInMaintenance(truckId)
    return
  }

  if (
    (status === "concluida" || status === "cancelada") &&
    previousStatus === "em_andamento"
  ) {
    await releaseTruckAfterMaintenance(truckId)
  }
}
