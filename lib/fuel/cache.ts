import { mutate } from "swr"
import { invalidateFinanceCaches } from "@/lib/api/services/finance"

export function revalidateFuelCaches(freightId?: string): void {
  void mutate("fuel-refills-all")
  void mutate("reports-fuel-refills")
  invalidateFinanceCaches()

  if (freightId) {
    void mutate(["freight-expenses", freightId])
    void mutate(["report-freight-costs", freightId])
    void mutate(["freight-fuel", freightId])
  }

  void mutate((key) => {
    if (
      key === "fuel-refills-all" ||
      key === "reports-fuel-refills" ||
      key === "op-trucks" ||
      key === "freights-list"
    ) {
      return true
    }
    if (!Array.isArray(key)) return false
    const head = key[0]
    return (
      head === "freight-expenses" ||
      head === "report-freight-costs" ||
      head === "freight-fuel" ||
      head === "truck" ||
      head === "trucks"
    )
  })
}
