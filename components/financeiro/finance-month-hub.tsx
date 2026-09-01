"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Settings2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CompetenciaNavigator } from "@/components/shared/competencia-navigator"
import { EntityFilterSelect } from "@/components/shared/entity-filter-select"
import { FinanceEntriesTable } from "@/components/financeiro/finance-entries-table"
import { FinancePendingFixedList } from "@/components/financeiro/finance-pending-fixed-list"
import { ListPagination } from "@/components/shared/list-pagination"
import { FinanceCharts } from "@/components/financeiro/finance-charts"
import {
  getFixedExpenseLaunchStatus,
  launchFixedExpense,
  launchPendingFixedExpenses,
} from "@/lib/api/services/fixed-expenses"
import {
  getCashFlow,
  invalidateFinanceCaches,
  listFinanceEntries,
} from "@/lib/api/services/finance"
import { useOperationContext } from "@/hooks/use-operation-context"
import { getTruckLabel } from "@/lib/freight/active-trip"
import { formatBRL } from "@/lib/format/currency"
import { formatCompetenciaLabel } from "@/lib/format/dates"
import { SEMANTIC } from "@/lib/ui/status-colors"
import { cn } from "@/lib/utils"
import type { FinanceEntry, FinanceEntryStatus, FinanceEntryType } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"

const DEFAULT_PAGE_SIZE = 50
const PAGE_SIZE_OPTIONS = [25, 50, 100]

interface FinanceMonthHubProps {
  competencia: { mes: number; ano: number }
  onShift: (delta: number) => void
  canAdmin?: boolean
  onEditEntry: (entry: FinanceEntry) => void
  onDeleteEntry: (entry: FinanceEntry) => void
  onOpenFixedManager: () => void
  onNewEntry?: () => void
  /** Notifies parent when the driver filter changes — used to pre-populate the payment sheet. */
  onDriverFilterChange?: (driverId: string | undefined) => void
}

export function FinanceMonthHub({
  competencia,
  onShift,
  canAdmin,
  onEditEntry,
  onDeleteEntry,
  onOpenFixedManager,
  onNewEntry,
  onDriverFilterChange,
}: FinanceMonthHubProps) {
  const [filterType, setFilterType] = useState<FinanceEntryType | "all">("all")
  const [filterStatus, setFilterStatus] = useState<FinanceEntryStatus | "all">("all")
  const [filterTruckId, setFilterTruckId] = useState<string | undefined>()
  const [filterDriverId, setFilterDriverId] = useState<string | undefined>()
  const [launchingAll, setLaunchingAll] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const { trucks, drivers } = useOperationContext()

  // Reset all filters when the competência changes
  useEffect(() => {
    setFilterType("all")
    setFilterStatus("all")
    setFilterTruckId(undefined)
    handleDriverFilterChange(undefined)
    setPage(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competencia.mes, competencia.ano])

  // Reset page when any filter changes
  useEffect(() => {
    setPage(1)
  }, [filterType, filterStatus, filterTruckId, filterDriverId])

  const hasVehicleFilter = Boolean(filterTruckId || filterDriverId)
  const competenciaKey = `${competencia.ano}-${competencia.mes}`
  const exportLabel = `${competencia.ano}-${String(competencia.mes).padStart(2, "0")}`

  const { data: cashFlow, isLoading: loadingCash, mutate: refreshCash } = useSWR(
    ["cash-flow", competencia.mes, competencia.ano, filterTruckId, filterDriverId],
    () => getCashFlow(competencia, filterTruckId, filterDriverId),
    { keepPreviousData: false },
  )

  const { data: entriesPage, isLoading: loadingEntries, mutate: refreshEntries } = useSWR(
    [
      "finance-entries",
      filterType,
      filterStatus,
      page,
      pageSize,
      competencia.mes,
      competencia.ano,
      filterTruckId,
      filterDriverId,
    ],
    () =>
      listFinanceEntries(
        page,
        pageSize,
        filterType === "all" ? undefined : filterType,
        filterStatus === "all" ? undefined : filterStatus,
        undefined,
        competencia,
        filterTruckId,
        filterDriverId,
      ),
    { keepPreviousData: false },
  )
  const entries = entriesPage?.items ?? []
  const totalEntries = entriesPage?.total ?? 0
  const totalPages = entriesPage?.pages ?? 1

  const { data: launchStatus, isLoading: loadingLaunch, mutate: refreshLaunch } = useSWR(
    canAdmin ? ["fixed-launch-status", competencia.mes, competencia.ano] : null,
    () => getFixedExpenseLaunchStatus(competencia),
  )

  async function refreshAll() {
    invalidateFinanceCaches()
    await Promise.all([refreshEntries(), refreshCash(), refreshLaunch()])
  }

  async function handleMarkPaid(entry: FinanceEntry) {
    const { updateFinanceEntry } = await import("@/lib/api/services/finance")
    try {
      await updateFinanceEntry(entry.id, { status: "pago" })
      await refreshAll()
      toast.success("Lançamento marcado como pago")
    } catch {
      toast.error("Erro ao atualizar lançamento")
    }
  }

  async function handleLaunchOne(id: string, vencimento?: string) {
    try {
      await launchFixedExpense(id, vencimento)
      await refreshAll()
      toast.success("Despesa fixa lançada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao lançar")
    }
  }

  async function handleLaunchAll() {
    setLaunchingAll(true)
    try {
      const result = await launchPendingFixedExpenses(competencia)
      await refreshAll()
      toast.success(
        `${result.launched_count} lançado(s), ${result.skipped_count} ignorado(s)`,
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao lançar pendentes")
    } finally {
      setLaunchingAll(false)
    }
  }

  const truckItems = trucks.map((t) => ({
    id: t.id,
    label: getTruckLabel(trucks, t.id) ?? `${t.plate} — ${t.model}`,
  }))

  const driverItems = drivers.map((d) => ({
    id: d.id,
    label: d.name,
  }))

  function handleDriverFilterChange(id: string | undefined) {
    setFilterDriverId(id)
    onDriverFilterChange?.(id)
  }

  const receitas = cashFlow?.total_receitas ?? 0
  const despesas = cashFlow?.total_despesas ?? 0
  const saldo = cashFlow?.saldo ?? 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold capitalize">
            {formatCompetenciaLabel(competencia.mes, competencia.ano)}
          </h2>
          <p className="text-sm text-muted-foreground">
            Gastos da viagem entram pelo frete e aparecem aqui automaticamente. Use lançamentos
            manuais para overhead e ajustes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CompetenciaNavigator
            mes={competencia.mes}
            ano={competencia.ano}
            onPrevious={() => onShift(-1)}
            onNext={() => onShift(1)}
          />
          {canAdmin && (
            <Button variant="outline" size="sm" onClick={onOpenFixedManager}>
              <Settings2 className="mr-1.5 h-4 w-4" />
              Gastos fixos
            </Button>
          )}
        </div>
      </div>

      {/* Vehicle filters */}
      <div className="flex flex-wrap items-center gap-2">
        <EntityFilterSelect
          value={filterTruckId}
          onValueChange={setFilterTruckId}
          items={truckItems}
          allLabel="Todos caminhões"
          className="w-[170px]"
          disabled={trucks.length === 0}
        />
        <EntityFilterSelect
          value={filterDriverId}
          onValueChange={handleDriverFilterChange}
          items={driverItems}
          allLabel="Todos motoristas"
          className="w-[165px]"
          disabled={drivers.length === 0}
        />
        {hasVehicleFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setFilterTruckId(undefined)
              setFilterDriverId(undefined)
            }}
          >
            <X className="h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>

      {/* Cash-flow strip */}
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 rounded-lg border bg-muted/20 px-4 py-3 text-sm">
        {loadingCash ? (
          <Skeleton className="h-5 w-64" />
        ) : (
          <>
            <span>
              Receitas{" "}
              <strong className={cn("tabular-nums", SEMANTIC.positive)}>
                {formatBRL(receitas)}
              </strong>
            </span>
            <span className="text-muted-foreground">·</span>
            <span>
              Despesas{" "}
              <strong className={cn("tabular-nums", SEMANTIC.negative)}>
                {formatBRL(despesas)}
              </strong>
            </span>
            <span className="text-muted-foreground">·</span>
            <span>
              Saldo{" "}
              <strong
                className={cn(
                  "tabular-nums",
                  saldo >= 0 ? SEMANTIC.positive : SEMANTIC.negative,
                )}
              >
                {formatBRL(saldo)}
              </strong>
            </span>
            {hasVehicleFilter && (
              <span className="ml-auto text-xs text-muted-foreground">
                Apenas lançamentos vinculados a frete
              </span>
            )}
          </>
        )}
      </div>

      {canAdmin && (
        <FinancePendingFixedList
          items={launchStatus ?? []}
          loading={loadingLaunch}
          launching={launchingAll}
          onLaunchOne={handleLaunchOne}
          onLaunchAll={handleLaunchAll}
        />
      )}

      {/* Charts */}
      {!loadingEntries && entries.length > 0 && (
        <FinanceCharts
          entries={entries}
          cashFlow={cashFlow}
          competencia={competencia}
          truckId={filterTruckId}
          driverId={filterDriverId}
        />
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium">
          Lançamentos{" "}
          <span className="font-normal text-muted-foreground">
            ({totalEntries} neste mês{hasVehicleFilter ? ", filtrado" : ""})
          </span>
        </p>
        <FinanceEntriesTable
          key={competenciaKey}
          entries={entries}
          loading={loadingEntries}
          canAdmin={canAdmin}
          filterType={filterType}
          filterStatus={filterStatus}
          onFilterTypeChange={setFilterType}
          onFilterStatusChange={setFilterStatus}
          onMarkPaid={canAdmin ? handleMarkPaid : undefined}
          onEdit={canAdmin ? onEditEntry : undefined}
          onDelete={canAdmin ? onDeleteEntry : undefined}
          onNewEntry={canAdmin ? onNewEntry : undefined}
          exportLabel={exportLabel}
        />
        {!loadingEntries && totalPages > 1 && (
          <ListPagination
            page={page}
            pageSize={pageSize}
            total={totalEntries}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        )}
      </div>
    </div>
  )
}
