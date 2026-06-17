import { mutate } from "swr"
import { revalidateFleetAndFreightCaches } from "@/lib/freight/sync-fleet-status"

export function revalidateMaintenanceCaches(): void {
  void mutate("maintenance-list")
  void mutate("maintenance-alerts")
  void mutate("reports-kpis")
  revalidateFleetAndFreightCaches()
}
