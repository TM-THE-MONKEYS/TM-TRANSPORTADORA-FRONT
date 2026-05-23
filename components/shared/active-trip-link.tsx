import Link from "next/link"
import { Route } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { FreightOrder } from "@/types"

export function ActiveTripLink({ freight }: { freight: FreightOrder | null | undefined }) {
  if (!freight) return null

  return (
    <Link
      href={`/dashboard/fretes/${freight.id}`}
      className="mt-2 inline-flex max-w-full flex-wrap items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-xs text-orange-900 transition-colors hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100"
    >
      <Route className="h-3.5 w-3.5 shrink-0" />
      <Badge variant="secondary" className="bg-orange-200/80 text-[10px] text-orange-900">
        Em trânsito
      </Badge>
      <span className="font-medium">{freight.code}</span>
      <span className="text-orange-800/80 dark:text-orange-200/80">
        {freight.origin_city}/{freight.origin_state} → {freight.destination_city}/{freight.destination_state}
      </span>
    </Link>
  )
}
