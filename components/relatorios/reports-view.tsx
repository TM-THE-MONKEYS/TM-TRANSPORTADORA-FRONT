"use client"

import { useMemo } from "react"
import useSWR from "swr"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  CircleDollarSign,
  Fuel,
  Package,
  TrendingUp,
  Truck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/page-header"
import { CompetenciaNavigator } from "@/components/shared/competencia-navigator"
import { RecentFuelRefillsReport } from "@/components/relatorios/recent-fuel-refills-report"
import { RecentFreightsReport } from "@/components/relatorios/recent-freights-report"
import { useCompetencia } from "@/hooks/use-competencia"
import { getCompetenciaReport } from "@/lib/api/services/finance"
import { getDashboardKpis, getFreightsByStatus } from "@/lib/api/services/dashboard"
import { formatBRL } from "@/lib/format/currency"
import { formatCompetenciaLabel } from "@/lib/format/dates"
import { FREIGHT_STATUS_LABELS } from "@/lib/freight/status"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import { cn } from "@/lib/utils"
import type { FreightStatus } from "@/types"

// ── Color maps ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  orcamento:     "var(--color-chart-5)",
  confirmado:    "var(--color-chart-1)",
  em_coleta:     "var(--color-chart-3)",
  em_transporte: "var(--color-chart-2)",
  entregue:      "oklch(0.65 0.15 145)",
  cancelado:     "var(--color-destructive)",
}

function formatChartDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function ReportsView() {
  const canFinance = usePermission(PERMISSIONS.financeRead)
  const { competencia, shift } = useCompetencia()

  const { data: kpis, isLoading: loadingKpis } = useSWR(
    "reports-kpis",
    () => getDashboardKpis(),
  )
  const { data: byStatus } = useSWR("reports-freight-status", getFreightsByStatus)
  const { data: competenciaReport, isLoading: loadingCompetencia } = useSWR(
    canFinance ? ["competencia-report", competencia.mes, competencia.ano] : null,
    () => getCompetenciaReport(competencia),
  )

  const statusData = useMemo(
    () =>
      (byStatus ?? []).map((row) => ({
        ...row,
        label: FREIGHT_STATUS_LABELS[row.status as FreightStatus] ?? row.status,
      })),
    [byStatus],
  )

  const totalFreights = useMemo(
    () => statusData.reduce((s, r) => s + r.count, 0),
    [statusData],
  )

  const revenueData = useMemo(
    () =>
      (competenciaReport?.daily_series ?? []).map((p) => ({
        ...p,
        label: formatChartDate(p.date),
        revenue: p.receitas,
      })),
    [competenciaReport],
  )

  const totalRevenueMonth = competenciaReport?.cash_flow.total_receitas ?? 0
  const totalExpensesMonth = competenciaReport?.cash_flow.total_despesas ?? 0
  const margin = totalRevenueMonth - totalExpensesMonth

  const peakRevenue = useMemo(
    () =>
      revenueData.reduce(
        (best, p) => (p.revenue > best.revenue ? p : best),
        { date: "", revenue: 0, label: "" },
      ),
    [revenueData],
  )

  const categoryData = useMemo(
    () => competenciaReport?.expenses_by_category ?? [],
    [competenciaReport],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Análise operacional e financeira por competência"
        actions={
          canFinance ? (
            <CompetenciaNavigator
              mes={competencia.mes}
              ano={competencia.ano}
              onPrevious={() => shift(-1)}
              onNext={() => shift(1)}
              size="md"
            />
          ) : undefined
        }
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard
          label="Fretes em andamento"
          value={String(kpis?.freights_in_progress ?? 0)}
          hint="Confirmados até em transporte"
          icon={Package}
          tone="primary"
          loading={loadingKpis}
        />
        <ReportKpiCard
          label="Caminhões ativos"
          value={String(kpis?.active_trucks ?? 0)}
          hint="Disponíveis ou em viagem"
          icon={Truck}
          loading={loadingKpis}
        />
        {canFinance && (
          <>
            <ReportKpiCard
              label={`Receita — ${formatCompetenciaLabel(competencia.mes, competencia.ano)}`}
              value={formatBRL(totalRevenueMonth)}
              hint={
                peakRevenue.revenue > 0
                  ? `Pico diário: ${formatBRL(peakRevenue.revenue)}`
                  : undefined
              }
              icon={TrendingUp}
              tone="success"
              loading={loadingCompetencia}
            />
            <ReportKpiCard
              label="Margem da competência"
              value={formatBRL(margin)}
              hint="Receitas − despesas do mês"
              icon={CircleDollarSign}
              tone={margin >= 0 ? "success" : "danger"}
              loading={loadingCompetencia}
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <TrendingUp className="mr-1.5 h-4 w-4" />
            Visão geral
          </TabsTrigger>
          <TabsTrigger value="freights">
            <Package className="mr-1.5 h-4 w-4" />
            Fretes
          </TabsTrigger>
          <TabsTrigger value="fuel">
            <Fuel className="mr-1.5 h-4 w-4" />
            Combustível
          </TabsTrigger>
        </TabsList>

        {/* ── VISÃO GERAL ── */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">

            {/* Revenue chart — 2 cols */}
            {canFinance && (
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Receitas — {formatCompetenciaLabel(competencia.mes, competencia.ano)}
                  </CardTitle>
                  <CardDescription>
                    Série diária por competência (lançamentos financeiros)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[260px]">
                    {revenueData.length === 0 ? (
                      <EmptyChart label="Sem receitas no período" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={revenueData}
                          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 10 }}
                            interval="preserveStartEnd"
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) =>
                              v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                            }
                          />
                          <Tooltip
                            formatter={(v: number) => [formatBRL(v), "Receita"]}
                            labelFormatter={(l) => String(l)}
                            contentStyle={{
                              fontSize: 12,
                              borderRadius: 8,
                              border: "1px solid var(--border)",
                              boxShadow: "0 4px 12px rgba(0,0,0,.08)",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--color-chart-2)"
                            strokeWidth={2}
                            fill="url(#revGrad)"
                            dot={false}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Resumo abaixo do gráfico */}
                  {revenueData.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 divide-x rounded-lg border bg-muted/20 text-center text-xs">
                      <div className="py-2">
                        <p className="text-muted-foreground">Total mês</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-green-700 dark:text-green-400">
                          {formatBRL(totalRevenueMonth)}
                        </p>
                      </div>
                      <div className="py-2">
                        <p className="text-muted-foreground">Despesas mês</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-destructive">
                          {formatBRL(totalExpensesMonth)}
                        </p>
                      </div>
                      <div className="py-2">
                        <p className="text-muted-foreground">Pico</p>
                        <p className="mt-0.5 font-semibold tabular-nums">
                          {peakRevenue.revenue > 0 ? formatBRL(peakRevenue.revenue) : "—"}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Status breakdown */}
            <Card className={!canFinance ? "lg:col-span-3" : undefined}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Fretes por status</CardTitle>
                    <CardDescription>
                      {totalFreights > 0 ? `${totalFreights} fretes na base` : "Sem fretes"}
                    </CardDescription>
                  </div>
                  {totalFreights > 0 && (
                    <Badge variant="secondary" className="tabular-nums">
                      {totalFreights}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {statusData.length === 0 ? (
                  <EmptyChart label="Sem dados de fretes" />
                ) : (
                  <div className="space-y-4">
                    {/* Donut */}
                    <div className="mx-auto h-[140px] w-full max-w-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            dataKey="count"
                            nameKey="label"
                            innerRadius="55%"
                            outerRadius="80%"
                            paddingAngle={2}
                          >
                            {statusData.map((entry) => (
                              <Cell
                                key={entry.status}
                                fill={STATUS_COLORS[entry.status] ?? "var(--color-chart-1)"}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v: number, name: string) => [`${v} frete(s)`, name]}
                            contentStyle={{ fontSize: 12, borderRadius: 8 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Breakdown list */}
                    <div className="space-y-2.5">
                      {statusData.map((row) => {
                        const pct =
                          totalFreights > 0
                            ? Math.round((row.count / totalFreights) * 100)
                            : 0
                        return (
                          <div key={row.status}>
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="inline-block h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      STATUS_COLORS[row.status] ?? "var(--color-chart-1)",
                                  }}
                                />
                                <span className="text-xs">{row.label}</span>
                              </div>
                              <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                                {row.count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor:
                                    STATUS_COLORS[row.status] ?? "var(--color-chart-1)",
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

            {/* Financial summary (canFinance) */}
            {canFinance && (
              <Card className="lg:col-span-3">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Indicadores financeiros da competência</CardTitle>
                  <CardDescription>
                    {formatCompetenciaLabel(competencia.mes, competencia.ano)} — receitas, despesas e pendências
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <FinSummaryTile
                      label="Receita total"
                      value={formatBRL(competenciaReport?.cash_flow.total_receitas ?? 0)}
                      tone="success"
                      loading={loadingCompetencia}
                    />
                    <FinSummaryTile
                      label="Despesas totais"
                      value={formatBRL(competenciaReport?.cash_flow.total_despesas ?? 0)}
                      tone="danger"
                      loading={loadingCompetencia}
                    />
                    <FinSummaryTile
                      label="Saldo líquido"
                      value={formatBRL(competenciaReport?.cash_flow.saldo ?? 0)}
                      tone={margin >= 0 ? "success" : "danger"}
                      loading={loadingCompetencia}
                    />
                    <FinSummaryTile
                      label="Pendências"
                      value={formatBRL(
                        (competenciaReport?.cash_flow.receitas_pendentes ?? 0) +
                          (competenciaReport?.cash_flow.despesas_pendentes ?? 0),
                      )}
                      hint="Receitas + despesas pendentes"
                      tone={
                        (competenciaReport?.cash_flow.receitas_pendentes ?? 0) +
                          (competenciaReport?.cash_flow.despesas_pendentes ?? 0) >
                        0
                          ? "warning"
                          : "default"
                      }
                      loading={loadingCompetencia}
                    />
                  </div>

                  {categoryData.length > 0 && (
                    <div className="mt-6 h-[220px]">
                      <p className="mb-2 text-sm font-medium">Despesas por categoria</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData.slice(0, 8)} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                          <XAxis dataKey="categoria" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`)} />
                          <Tooltip formatter={(v: number) => [formatBRL(v), "Total"]} />
                          <Bar dataKey="valor" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── FRETES ── */}
        <TabsContent value="freights" className="mt-4">
          <RecentFreightsReport />
        </TabsContent>

        {/* ── COMBUSTÍVEL ── */}
        <TabsContent value="fuel" className="mt-4">
          <RecentFuelRefillsReport competencia={competencia} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  )
}

function ReportKpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  loading,
}: {
  label: string
  value: string
  hint?: string
  icon: React.ElementType
  tone?: "default" | "primary" | "success" | "danger" | "warning"
  loading?: boolean
}) {
  const accent = {
    default:  "before:bg-border",
    primary:  "before:bg-primary",
    success:  "before:bg-green-500",
    warning:  "before:bg-amber-500",
    danger:   "before:bg-destructive",
  }[tone]

  const iconCn = {
    default:  "text-muted-foreground",
    primary:  "text-primary",
    success:  "text-green-500",
    warning:  "text-amber-500",
    danger:   "text-destructive",
  }[tone]

  const valueCn = {
    default:  "",
    primary:  "text-primary",
    success:  "text-green-700 dark:text-green-400",
    warning:  "text-amber-700 dark:text-amber-400",
    danger:   "text-destructive",
  }[tone]

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all",
        "hover:shadow-md hover:-translate-y-0.5",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-xl",
        accent,
      )}
    >
      <Icon
        className={cn("absolute right-4 top-4 h-14 w-14 opacity-[0.06]", iconCn)}
        aria-hidden
      />
      <div className="relative space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        {loading ? (
          <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
        ) : (
          <p className={cn("text-3xl font-bold tracking-tight tabular-nums", valueCn)}>
            {value}
          </p>
        )}
        {hint && !loading && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
    </div>
  )
}

function FinSummaryTile({
  label,
  value,
  suffix,
  hint,
  tone = "default",
  loading,
}: {
  label: string
  value: string
  suffix?: string
  hint?: string
  tone?: "default" | "success" | "danger" | "warning"
  loading?: boolean
}) {
  const border = {
    default:  "border-border",
    success:  "border-green-500/30 bg-green-500/5",
    danger:   "border-destructive/30 bg-destructive/5",
    warning:  "border-amber-500/30 bg-amber-500/5",
  }[tone]

  const valueCn = {
    default:  "",
    success:  "text-green-700 dark:text-green-400",
    danger:   "text-destructive",
    warning:  "text-amber-600 dark:text-amber-400",
  }[tone]

  return (
    <div className={cn("rounded-xl border p-4", border)}>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {loading ? (
        <div className="mt-2 h-8 w-28 animate-pulse rounded bg-muted" />
      ) : (
        <p className={cn("mt-1 text-2xl font-bold tabular-nums", valueCn)}>
          {value}
          {suffix && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">{suffix}</span>
          )}
        </p>
      )}
      {hint && !loading && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
