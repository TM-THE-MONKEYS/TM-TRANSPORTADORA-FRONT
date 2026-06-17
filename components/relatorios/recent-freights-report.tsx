"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { ChevronRight, Package, TrendingUp } from "lucide-react"
import { FreightReportDetailSheet } from "@/components/relatorios/freight-report-detail-sheet"
import { FreightStatusBadge } from "@/components/fretes/freight-status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { listFreights } from "@/lib/api/services/freight"
import { formatBRL } from "@/lib/format/currency"
import { formatWeightKg } from "@/lib/format/numbers"
import { formatDateBR } from "@/lib/format/dates"
import { sortFreightsByRecent } from "@/lib/freight/report-metrics"
import { getDriverName, getTruckLabel } from "@/lib/freight/active-trip"
import { useOperationContext } from "@/hooks/use-operation-context"
import { cn } from "@/lib/utils"
import type { FreightOrder } from "@/types"

const PAGE_SIZE = 15

export function RecentFreightsReport() {
  const { drivers, trucks } = useOperationContext()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data, isLoading } = useSWR("reports-recent-freights", () => listFreights(1, PAGE_SIZE))
  const freights = useMemo(() => sortFreightsByRecent(data?.items ?? []), [data])

  const totalValue = useMemo(
    () => freights.reduce((s, f) => s + f.value_brl, 0),
    [freights],
  )
  const inProgress = useMemo(
    () =>
      freights.filter((f) =>
        ["confirmado", "em_coleta", "em_transporte"].includes(f.status),
      ).length,
    [freights],
  )

  function openDetail(freight: FreightOrder) {
    setSelectedId(freight.id)
    setSheetOpen(true)
  }

  return (
    <>
      {/* Stats strip */}
      {!isLoading && freights.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fretes listados</p>
              <p className="text-base font-bold tabular-nums">{freights.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Volume total</p>
              <p className="text-base font-bold tabular-nums text-green-700 dark:text-green-400">
                {formatBRL(totalValue)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Em andamento</p>
              <p className="text-base font-bold tabular-nums text-primary">{inProgress}</p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Últimos fretes</CardTitle>
          <CardDescription>
            Clique em um frete para ver custos, financeiro, duração e ocorrências
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : freights.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Package className="h-8 w-8 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">Nenhum frete cadastrado.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {freights.map((f) => {
                const driverName = f.driver_id ? getDriverName(drivers, f.driver_id) : null
                const truckLabel = f.truck_id ? getTruckLabel(trucks, f.truck_id) : null
                const meta = [driverName, truckLabel].filter(Boolean).join(" / ")

                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => openDetail(f)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 sm:gap-4"
                    >
                      {/* Status dot */}
                      <StatusDot status={f.status} />

                      {/* Main info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{f.code}</span>
                          <FreightStatusBadge status={f.status} />
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {f.origin_city}/{f.origin_state} → {f.destination_city}/{f.destination_state}
                          {f.customer_name ? ` · ${f.customer_name}` : ""}
                        </p>
                        {meta && (
                          <p className="text-xs text-muted-foreground">{meta}</p>
                        )}
                      </div>

                      {/* Right side */}
                      <div className="shrink-0 text-right">
                        <p className="font-semibold tabular-nums">{formatBRL(f.value_brl)}</p>
                        <p className="text-xs text-muted-foreground">{formatWeightKg(f.weight_kg)}</p>
                        {f.deadline_at && (
                          <p className="text-xs text-muted-foreground">
                            Prazo: {formatDateBR(f.deadline_at)}
                          </p>
                        )}
                      </div>

                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <FreightReportDetailSheet
        freightId={selectedId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  )
}

const STATUS_DOT_COLORS: Record<string, string> = {
  orcamento:     "bg-gray-400",
  confirmado:    "bg-blue-500",
  em_coleta:     "bg-amber-500",
  em_transporte: "bg-indigo-500",
  entregue:      "bg-green-500",
  cancelado:     "bg-destructive",
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "h-2.5 w-2.5 shrink-0 rounded-full",
        STATUS_DOT_COLORS[status] ?? "bg-muted",
      )}
    />
  )
}
