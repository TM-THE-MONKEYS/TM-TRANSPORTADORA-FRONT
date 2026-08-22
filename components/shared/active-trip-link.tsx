import Link from "next/link"
import { Route } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SEMANTIC } from "@/lib/ui/status-colors"
import { cn } from "@/lib/utils"
import type { FreightOrder } from "@/types"

export function ActiveTripLink({ freight }: { freight: FreightOrder | null | undefined }) {
  if (!freight) return null

  return (
    <Link
      href={`/dashboard/fretes/${freight.id}`}
      className={cn(
        "mt-2 inline-flex max-w-full flex-wrap items-center gap-2 rounded-md border px-2 py-1 text-xs transition-colors",
        SEMANTIC.progressSurface,
        SEMANTIC.progressText,
        "hover:bg-status-progress/10",
      )}
    >
      <Route className="h-3.5 w-3.5 shrink-0" />
      <Badge variant="secondary" className="bg-status-progress/20 text-[10px] text-status-progress">
        Em trânsito
      </Badge>
      <span className="font-medium text-foreground">{freight.code}</span>
      <span className="opacity-80">
        {freight.origin_city}/{freight.origin_state} → {freight.destination_city}/{freight.destination_state}
      </span>
    </Link>
  )
}
