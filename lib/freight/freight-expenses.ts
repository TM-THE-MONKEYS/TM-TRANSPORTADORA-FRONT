import type { FreightCost } from "@/types"
import type { FuelRefill } from "@/lib/api/services/fuel"
import { fuelRefillToCostRow } from "@/lib/api/services/fuel"

/** Une custos da API e abastecimentos (/fuel) sem duplicar pelo id do custo. */
export function mergeFreightCostsWithFuel(
  apiCosts: FreightCost[],
  refills: FuelRefill[],
): FreightCost[] {
  const byId = new Map<string, FreightCost>()

  for (const cost of apiCosts) {
    byId.set(cost.id, cost)
  }

  for (const refill of refills) {
    const row = fuelRefillToCostRow(refill)
    const linkedCostId = refill.freight_cost_id
    if (linkedCostId && byId.has(linkedCostId)) continue
    if (!byId.has(row.id)) byId.set(row.id, row)
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}
