"use client"

import { useState } from "react"
import useSWR from "swr"
import { ChevronRight } from "lucide-react"
import { FreightReportDetailSheet } from "@/components/relatorios/freight-report-detail-sheet"
import { FreightStatusBadge } from "@/components/fretes/freight-status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { listFreights } from "@/lib/api/services/freight"
import { formatBRL } from "@/lib/format/currency"
import { formatWeightKg } from "@/lib/format/numbers"
import { formatDateTimeBR } from "@/lib/format/dates"
import { sortFreightsByRecent } from "@/lib/freight/report-metrics"
import { getDriverName, getTruckLabel } from "@/lib/freight/active-trip"
import { useOperationContext } from "@/hooks/use-operation-context"
import type { FreightOrder } from "@/types"

const PAGE_SIZE = 15

export function RecentFreightsReport() {
  const { drivers, trucks } = useOperationContext()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data, isLoading } = useSWR("reports-recent-freights", () => listFreights(1, PAGE_SIZE))
  const freights = sortFreightsByRecent(data?.items ?? [])

  function openDetail(freight: FreightOrder) {
    setSelectedId(freight.id)
    setSheetOpen(true)
  }

  return (
    <>
      <div className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Últimos fretes</h2>
          <p className="text-sm text-muted-foreground">
            Clique em um frete para ver custos, financeiro, tempo de trajeto e observações
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : freights.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Nenhum frete cadastrado.</p>
        ) : (
          <ul className="divide-y">
            {freights.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => openDetail(f)}
                  className="flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{f.code}</span>
                      <FreightStatusBadge status={f.status} />
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {f.origin_city}/{f.origin_state} → {f.destination_city}/{f.destination_state}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {f.customer_name ?? "Cliente"} · Atualizado {formatDateTimeBR(f.updated_at)}
                      {(f.driver_id || f.truck_id) && (
                        <>
                          {" "}
                          ·{" "}
                          {f.driver_id && getDriverName(drivers, f.driver_id)}
                          {f.driver_id && f.truck_id && " / "}
                          {f.truck_id && getTruckLabel(trucks, f.truck_id)}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 sm:text-right">
                    <div>
                      <p className="font-medium">{formatBRL(f.value_brl)}</p>
                      <p className="text-xs text-muted-foreground">{formatWeightKg(f.weight_kg)}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FreightReportDetailSheet
        freightId={selectedId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  )
}
