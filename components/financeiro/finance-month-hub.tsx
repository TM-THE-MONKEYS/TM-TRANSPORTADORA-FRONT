"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Building2, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "oklch(0.65 0.15 145)",
]

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

  const { data: cashFlow, isLoading: loadingCash, mutate: refreshCash } = useSWR(
    ["cash-flow", competencia.mes, competencia.ano],
    () => getCashFlow(competencia),
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
  )
  const entries = entriesPage?.items ?? []

  const { data: launchStatus, isLoading: loadingLaunch, mutate: refreshLaunch } = useSWR(
    canAdmin ? ["fixed-launch-status", competencia.mes, competencia.ano] : null,
    () => getFixedExpenseLaunchStatus(competencia),
  )

  const { data: fixedExpenses } = useSWR("fixed-expenses", listFixedExpenses)

  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of entries) {
      if (e.tipo === "despesa") {
        map[e.categoria] = (map[e.categoria] ?? 0) + e.valor
      }
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [entries])

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

      <div className="grid gap-4 sm:grid-cols-3">
        <MiniStat label="Receitas" value={formatBRL(cashFlow?.total_receitas ?? 0)} loading={loadingCash} tone="success" />
        <MiniStat label="Despesas" value={formatBRL(cashFlow?.total_despesas ?? 0)} loading={loadingCash} tone="danger" />
        <MiniStat label="Saldo" value={formatBRL(cashFlow?.saldo ?? 0)} loading={loadingCash} />
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumo da competência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <OverviewRow label="Receitas pagas" value={formatBRL(cashFlow?.receitas_pagas ?? 0)} />
            <OverviewRow label="Receitas pendentes" value={formatBRL(cashFlow?.receitas_pendentes ?? 0)} />
            <Separator />
            <OverviewRow label="Despesas pagas" value={formatBRL(cashFlow?.despesas_pagas ?? 0)} />
            <OverviewRow label="Despesas pendentes" value={formatBRL(cashFlow?.despesas_pendentes ?? 0)} />
            <Separator />
            <OverviewRow label="Saldo líquido" value={formatBRL(cashFlow?.saldo ?? 0)} bold />
            {canAdmin && (
              <OverviewRow
                label="Custo fixo mensal estimado"
                value={formatBRL(fixedMonthlyTotal)}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Despesas por categoria</CardTitle>
            <CardDescription>Competência atual</CardDescription>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Sem despesas registradas
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-[180px] w-full shrink-0 sm:w-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="55%"
                        outerRadius="80%"
                        paddingAngle={2}
                      >
                        {expensesByCategory.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [formatBRL(v), "Total"]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {expensesByCategory.slice(0, 6).map((cat, i) => {
                    const total = expensesByCategory.reduce((s, c) => s + c.value, 0)
                    const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0
                    return (
                      <div key={cat.name}>
                        <div className="mb-0.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                            />
                            <span className="truncate text-xs">{cat.name}</span>
                          </div>
                          <span className="shrink-0 text-xs font-semibold tabular-nums">{pct}%</span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {canAdmin && activeFixed.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Gastos fixos ativos</CardTitle>
                <CardDescription>
                  Total estimado: {formatBRL(fixedMonthlyTotal)}/mês
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onOpenFixedManager}>
                <Building2 className="mr-1.5 h-4 w-4" />
                Gerenciar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeFixed.map((fx) => (
                <div
                  key={fx.id}
                  className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5"
                >
                  <Building2 className="h-4 w-4 shrink-0 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{fx.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBRL(monthlyEquivalent(fx))}/mês
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
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
