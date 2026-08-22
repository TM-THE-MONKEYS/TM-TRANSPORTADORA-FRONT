"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CompetenciaNavigator } from "@/components/shared/competencia-navigator"
import { FinanceEntriesTable } from "@/components/financeiro/finance-entries-table"
import { FinancePendingFixedList } from "@/components/financeiro/finance-pending-fixed-list"
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
import { formatBRL } from "@/lib/format/currency"
import { formatCompetenciaLabel } from "@/lib/format/dates"
import { SEMANTIC } from "@/lib/ui/status-colors"
import { cn } from "@/lib/utils"
import type { FinanceEntry, FinanceEntryStatus, FinanceEntryType } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"

interface FinanceMonthHubProps {
  competencia: { mes: number; ano: number }
  onShift: (delta: number) => void
  canAdmin?: boolean
  onEditEntry: (entry: FinanceEntry) => void
  onDeleteEntry: (entry: FinanceEntry) => void
  onOpenFixedManager: () => void
  onNewEntry?: () => void
}

export function FinanceMonthHub({
  competencia,
  onShift,
  canAdmin,
  onEditEntry,
  onDeleteEntry,
  onOpenFixedManager,
  onNewEntry,
}: FinanceMonthHubProps) {
  const [filterType, setFilterType] = useState<FinanceEntryType | "all">("all")
  const [filterStatus, setFilterStatus] = useState<FinanceEntryStatus | "all">("all")
  const [launchingAll, setLaunchingAll] = useState(false)

  useEffect(() => {
    setFilterType("all")
    setFilterStatus("all")
  }, [competencia.mes, competencia.ano])

  const competenciaKey = `${competencia.ano}-${competencia.mes}`

  const { data: cashFlow, isLoading: loadingCash, mutate: refreshCash } = useSWR(
    ["cash-flow", competencia.mes, competencia.ano],
    () => getCashFlow(competencia),
    { keepPreviousData: false },
  )

  const { data: entriesPage, isLoading: loadingEntries, mutate: refreshEntries } = useSWR(
    ["finance-entries", filterType, filterStatus, competencia.mes, competencia.ano],
    () =>
      listFinanceEntries(
        1,
        100,
        filterType === "all" ? undefined : filterType,
        filterStatus === "all" ? undefined : filterStatus,
        undefined,
        competencia,
      ),
    { keepPreviousData: false },
  )
  const entries = entriesPage?.items ?? []

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

      {/* Barra de saldo compacta — sem cards KPI */}
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
              <strong className={cn("tabular-nums", SEMANTIC.negative)}>{formatBRL(despesas)}</strong>
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

      <div className="space-y-2">
        <p className="text-sm font-medium">
          Lançamentos{" "}
          <span className="font-normal text-muted-foreground">
            ({entries.length} neste mês)
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
        />
      </div>
    </div>
  )
}
