import { mutate } from "swr"
import { invalidateFinanceCaches } from "@/lib/api/services/finance"

/**
 * Invalida caches de frota/frete/financeiro após mutação.
 * Status do caminhão (disponivel ↔ em_viagem) é sincronizado no backend
 * em FreightService — o front não faz mais PATCH de truck após frete.
 */
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
