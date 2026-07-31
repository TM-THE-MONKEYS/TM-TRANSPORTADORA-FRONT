"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Building2, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CompetenciaNavigator } from "@/components/shared/competencia-navigator"
import { FinanceEntriesTable } from "@/components/financeiro/finance-entries-table"
import { FinancePendingFixedList } from "@/components/financeiro/finance-pending-fixed-list"
import {
  getFixedExpenseLaunchStatus,
  launchFixedExpense,
  launchPendingFixedExpenses,
  listFixedExpenses,
  monthlyEquivalent,
  isFixedExpenseActive,
} from "@/lib/api/services/fixed-expenses"
import {
  getCashFlow,
  invalidateFinanceCaches,
  listFinanceEntries,
} from "@/lib/api/services/finance"
import { formatBRL } from "@/lib/format/currency"
import { formatCompetenciaLabel } from "@/lib/format/dates"
import type { FinanceEntry, FinanceEntryStatus, FinanceEntryType } from "@/types"

interface FinanceMonthHubProps {
  competencia: { mes: number; ano: number }
  onShift: (delta: number) => void
  canAdmin?: boolean
  onEditEntry: (entry: FinanceEntry) => void
  onDeleteEntry: (entry: FinanceEntry) => void
  onOpenFixedManager: () => void
}

export function FinanceMonthHub({
  competencia,
  onShift,
  canAdmin,
  onEditEntry,
  onDeleteEntry,
  onOpenFixedManager,
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

  const swrEntriesKey = [
    "finance-entries",
    filterType,
    filterStatus,
    competencia.mes,
    competencia.ano,
  ]
  const { data: entriesPage, isLoading: loadingEntries, mutate: refreshEntries } = useSWR(
    swrEntriesKey,
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
  const showHubLoading = loadingCash || loadingEntries

  const { data: launchStatus, isLoading: loadingLaunch, mutate: refreshLaunch } = useSWR(
    canAdmin ? ["fixed-launch-status", competencia.mes, competencia.ano] : null,
    () => getFixedExpenseLaunchStatus(competencia),
  )

  const { data: fixedExpenses } = useSWR("fixed-expenses", listFixedExpenses)

  const activeFixed = useMemo(
    () => (fixedExpenses ?? []).filter((f) => isFixedExpenseActive(f)),
    [fixedExpenses],
  )
  const fixedMonthlyTotal = useMemo(
    () => activeFixed.reduce((s, f) => s + monthlyEquivalent(f), 0),
    [activeFixed],
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold capitalize">
            Hub da competência — {formatCompetenciaLabel(competencia.mes, competencia.ano)}
          </h2>
          <p className="text-sm text-muted-foreground">
            Lançamentos, gastos fixos e resumo do mês
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
              {activeFixed.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({activeFixed.length})
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MiniStat label="Receitas" value={formatBRL(cashFlow?.total_receitas ?? 0)} loading={showHubLoading} tone="success" />
        <MiniStat label="Despesas" value={formatBRL(cashFlow?.total_despesas ?? 0)} loading={showHubLoading} tone="danger" />
        <MiniStat label="Saldo" value={formatBRL(cashFlow?.saldo ?? 0)} loading={showHubLoading} />
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lançamentos do mês</CardTitle>
          <CardDescription>
            {entries.length} registro(s) na competência selecionada
          </CardDescription>
        </CardHeader>
        <CardContent>
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
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Resumo mensal</CardTitle>
              <CardDescription>Foco nos números que importam para a competência atual.</CardDescription>
            </div>
            {canAdmin && (
              <Button variant="outline" size="sm" onClick={onOpenFixedManager}>
                <Settings2 className="mr-1.5 h-4 w-4" />
                Gastos fixos
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <OverviewRow label="Receitas pagas" value={formatBRL(cashFlow?.receitas_pagas ?? 0)} />
          <OverviewRow label="Receitas pendentes" value={formatBRL(cashFlow?.receitas_pendentes ?? 0)} />
          <OverviewRow label="Despesas pagas" value={formatBRL(cashFlow?.despesas_pagas ?? 0)} />
          <OverviewRow label="Despesas pendentes" value={formatBRL(cashFlow?.despesas_pendentes ?? 0)} />
          <OverviewRow label="Saldo líquido" value={formatBRL(cashFlow?.saldo ?? 0)} bold />
          {canAdmin && (
            <OverviewRow
              label="Gastos fixos/mês"
              value={formatBRL(fixedMonthlyTotal)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MiniStat({
  label,
  value,
  loading,
  tone,
}: {
  label: string
  value: string
  loading?: boolean
  tone?: "success" | "danger"
}) {
  const valueCn =
    tone === "success"
      ? "text-green-700 dark:text-green-400"
      : tone === "danger"
        ? "text-destructive"
        : ""

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {loading ? (
        <div className="mt-1 h-8 w-24 animate-pulse rounded bg-muted" />
      ) : (
        <p className={`mt-1 text-2xl font-bold tabular-nums ${valueCn}`}>{value}</p>
      )}
    </div>
  )
}

function OverviewRow({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`text-sm text-muted-foreground ${bold ? "font-medium text-foreground" : ""}`}>
        {label}
      </span>
      <span className={`tabular-nums ${bold ? "text-base font-bold" : "text-sm font-medium"}`}>
        {value}
      </span>
    </div>
  )
}
