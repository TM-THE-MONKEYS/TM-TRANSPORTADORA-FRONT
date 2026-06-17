import { mutate } from "swr"
import { invalidateFinanceCaches } from "@/lib/api/services/finance"

export function revalidateTollCaches(freightId?: string): void {
  void mutate("toll-list-all")
  invalidateFinanceCaches()

  if (freightId) {
    void mutate(["toll-freight", freightId])
    void mutate(["toll-summary", freightId])
    void mutate(["freight-expenses", freightId])
    void mutate(["report-freight-costs", freightId])
  }

  void mutate((key) => {
    if (key === "toll-list-all") return true
    if (!Array.isArray(key)) return false
    const head = key[0]
    return (
      head === "toll-freight" ||
      head === "toll-summary" ||
      head === "freight-expenses" ||
      head === "report-freight-costs"
    )
  })
}
