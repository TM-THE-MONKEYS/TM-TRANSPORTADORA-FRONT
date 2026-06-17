"use client"

import { useMemo } from "react"
import useSWR from "swr"
import {
  Area,
  AreaChart,
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
  TrendingDown,
  TrendingUp,
  Truck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/page-header"
import { RecentFuelRefillsReport } from "@/components/relatorios/recent-fuel-refills-report"
import { RecentFreightsReport } from "@/components/relatorios/recent-freights-report"
import { getDashboardKpis, getFreightsByStatus, getRevenueSeries } from "@/lib/api/services/dashboard"
import { formatBRL } from "@/lib/format/currency"
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

  const { data: kpis, isLoading: loadingKpis } = useSWR(
    canFinance ? "reports-kpis" : null,
    () => getDashboardKpis(),
  )
  const { data: byStatus } = useSWR("reports-freight-status", getFreightsByStatus)
  const { data: revenue } = useSWR(
    canFinance ? "reports-revenue" : null,
    () => getRevenueSeries(30),
  )

  // ── Derived ──────────────────────────────────────────────────────────────

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
    () => (revenue ?? []).map((p) => ({ ...p, label: formatChartDate(p.date) })),
    [revenue],
  )

  const totalRevenue30d = useMemo(
    () => (revenue ?? []).reduce((s, p) => s + p.revenue, 0),
    [revenue],
  )

  const peakRevenue = useMemo(
    () => (revenue ?? []).reduce((best, p) => (p.revenue > best.revenue ? p : best), { date: "", revenue: 0 }),
    [revenue],
  )

  const margin =
    (kpis?.monthly_revenue_brl ?? 0) - (kpis?.operational_costs_brl ?? 0)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Análise de desempenho operacional e financeiro"
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
              label="Receita — 30 dias"
              value={formatBRL(totalRevenue30d)}
              hint={
                peakRevenue.date
                  ? `Pico: ${formatBRL(peakRevenue.revenue)} em ${formatChartDate(peakRevenue.date)}`
                  : undefined
              }
              icon={TrendingUp}
              tone="success"
              loading={loadingKpis && !revenue}
            />
            <ReportKpiCard
              label="Margem estimada"
              value={formatBRL(margin)}
              hint="Receita − custos operacionais"
              icon={CircleDollarSign}
              tone={margin >= 0 ? "success" : "danger"}
              loading={loadingKpis}
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
                  <CardTitle className="text-base">Receita — últimos 30 dias</CardTitle>
                  <CardDescription>
                    Receitas pagas registradas no módulo financeiro
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
                        <p className="text-muted-foreground">Total 30d</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-green-700 dark:text-green-400">
                          {formatBRL(totalRevenue30d)}
                        </p>
                      </div>
                      <div className="py-2">
                        <p className="text-muted-foreground">Média/dia</p>
                        <p className="mt-0.5 font-semibold tabular-nums">
                          {formatBRL(revenueData.length > 0 ? totalRevenue30d / revenueData.length : 0)}
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
                  <CardTitle className="text-base">Indicadores financeiros do período</CardTitle>
                  <CardDescription>Baseado nos KPIs operacionais e financeiros</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <FinSummaryTile
                      label="Receita total"
                      value={formatBRL(kpis?.monthly_revenue_brl ?? 0)}
                      tone="success"
                      loading={loadingKpis}
                    />
                    <FinSummaryTile
                      label="Custos operacionais"
                      value={formatBRL(kpis?.operational_costs_brl ?? 0)}
                      tone="danger"
                      loading={loadingKpis}
                    />
                    <FinSummaryTile
                      label="Margem estimada"
                      value={formatBRL(margin)}
                      tone={margin >= 0 ? "success" : "danger"}
                      loading={loadingKpis}
                    />
                    <FinSummaryTile
                      label="Pendências financeiras"
                      value={String(kpis?.financial_pending ?? 0)}
                      suffix={kpis?.financial_pending === 1 ? " em aberto" : " em aberto"}
                      tone={(kpis?.financial_pending ?? 0) > 0 ? "warning" : "default"}
                      loading={loadingKpis}
                    />
                  </div>
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
          <RecentFuelRefillsReport />
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
  tone = "default",
  loading,
}: {
  label: string
  value: string
  suffix?: string
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
    </div>
  )
}

// unused below — kept for tree-shaking safety
const _TrendingDown = TrendingDown
