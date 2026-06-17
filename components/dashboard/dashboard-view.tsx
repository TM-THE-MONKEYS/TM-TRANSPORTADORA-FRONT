"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
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
  AlertTriangle,
  ArrowRight,
  CircleDollarSign,
  Package,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wrench,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/shared/page-header"
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card"
import { DashboardRecentFreights } from "@/components/dashboard/dashboard-recent-freights"
import { useTenant } from "@/components/providers/tenant-provider"
import {
  getDashboardKpis,
  getFreightsByStatus,
  getRevenueSeries,
} from "@/lib/api/services/dashboard"
import { getCashFlow } from "@/lib/api/services/finance"
import { listCustomers } from "@/lib/api/services/freight"
import { listTrucks } from "@/lib/api/services/fleet"
import { formatBRL } from "@/lib/format/currency"
import { FREIGHT_STATUS_LABELS } from "@/lib/freight/status"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import { cn } from "@/lib/utils"
import type { DashboardFilters, FreightStatus } from "@/types"

const STATUS_COLORS: Record<string, string> = {
  orcamento:      "var(--color-chart-5)",
  confirmado:     "var(--color-chart-1)",
  em_coleta:      "var(--color-chart-3)",
  em_transporte:  "var(--color-chart-2)",
  entregue:       "oklch(0.65 0.15 145)",
  cancelado:      "var(--color-destructive)",
}

function formatChartDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

export function DashboardView() {
  const { branchId, branches } = useTenant()
  const [filters, setFilters] = useState<DashboardFilters>({})
  const canFinance = usePermission(PERMISSIONS.financeRead)
  const canFreightWrite = usePermission(PERMISSIONS.freightWrite)

  const hasActiveFilters =
    Boolean(filters.branch_id) || Boolean(filters.customer_id) || Boolean(filters.truck_id)

  function clearFilters() {
    setFilters({})
  }

  const swrKey = ["dashboard-kpis", branchId, filters] as const

  const { data: kpis, isLoading: loadingKpis } = useSWR(swrKey, () =>
    getDashboardKpis({ ...filters, branch_id: branchId ?? filters.branch_id }),
  )
  const { data: byStatus } = useSWR("freights-by-status", getFreightsByStatus)
  const { data: revenue } = useSWR(canFinance ? "revenue-series" : null, () => getRevenueSeries(30))
  const { data: customers } = useSWR("customers", listCustomers)
  const { data: trucksPage } = useSWR("trucks-filter", () => listTrucks(1, 200))
  const { data: cashFlow, isLoading: loadingCashFlow } = useSWR(
    canFinance ? "dashboard-cash-flow" : null,
    () => getCashFlow(),
  )

  const statusChartData = useMemo(
    () =>
      (byStatus ?? []).map((row) => ({
        ...row,
        label: FREIGHT_STATUS_LABELS[row.status as FreightStatus] ?? row.status,
      })),
    [byStatus],
  )

  const revenueChartData = useMemo(
    () =>
      (revenue ?? []).map((p) => ({
        ...p,
        label: formatChartDate(p.date),
      })),
    [revenue],
  )

  const totalFreights = useMemo(
    () => (byStatus ?? []).reduce((s, r) => s + r.count, 0),
    [byStatus],
  )

  const margin = (kpis?.monthly_revenue_brl ?? 0) - (kpis?.operational_costs_brl ?? 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Dashboard operacional"
        description="Visão da operação, finanças e pendências em um só lugar"
        actions={
          <>
            {canFreightWrite && (
              <Button size="sm" asChild>
                <Link href="/dashboard/fretes/novo">Novo frete</Link>
              </Button>
            )}
            {canFinance && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/relatorios">
                  Relatórios
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-4 py-2.5 shadow-sm">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Filtros
        </span>
        <Separator orientation="vertical" className="h-5" />

        {branches.length > 0 && (
          <Select
            value={filters.branch_id ?? branchId ?? "all"}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, branch_id: v === "all" ? undefined : v }))
            }
          >
            <SelectTrigger className="h-8 w-[150px] bg-background text-xs">
              <SelectValue placeholder="Filial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas filiais</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={filters.customer_id ?? "all"}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, customer_id: v === "all" ? undefined : v }))
          }
        >
          <SelectTrigger className="h-8 w-[180px] bg-background text-xs">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos clientes</SelectItem>
            {(customers ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.truck_id ?? "all"}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, truck_id: v === "all" ? undefined : v }))
          }
        >
          <SelectTrigger className="h-8 w-[165px] bg-background text-xs">
            <SelectValue placeholder="Caminhão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos caminhões</SelectItem>
            {(trucksPage?.items ?? []).map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.plate} — {t.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={clearFilters}
          >
            <X className="h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>

      {/* KPIs operacionais */}
      <section>
        <SectionLabel>Operacional</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardKpiCard
            label="Fretes em andamento"
            value={String(kpis?.freights_in_progress ?? 0)}
            hint="Confirmados até em transporte"
            icon={Package}
            tone="primary"
            loading={loadingKpis}
          />
          <DashboardKpiCard
            label="Caminhões ativos"
            value={String(kpis?.active_trucks ?? 0)}
            hint="Disponíveis ou em viagem"
            icon={Truck}
            loading={loadingKpis}
          />
          <DashboardKpiCard
            label="Motoristas disponíveis"
            value={String(kpis?.available_drivers ?? 0)}
            hint="Status ativo e sem frete"
            icon={Users}
            loading={loadingKpis}
          />
          <DashboardKpiCard
            label="Alertas de manutenção"
            value={String(kpis?.maintenance_alerts ?? 0)}
            hint="Próximos 30 dias"
            icon={Wrench}
            tone={(kpis?.maintenance_alerts ?? 0) > 0 ? "warning" : "default"}
            loading={loadingKpis}
          />
        </div>
      </section>

      {/* KPIs financeiros */}
      {canFinance && (
        <section>
          <SectionLabel>Financeiro</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardKpiCard
              label="Receita (período)"
              value={formatBRL(kpis?.monthly_revenue_brl ?? 0)}
              icon={TrendingUp}
              tone="success"
              loading={loadingKpis}
            />
            <DashboardKpiCard
              label="Custos operacionais"
              value={formatBRL(kpis?.operational_costs_brl ?? 0)}
              icon={TrendingDown}
              tone="danger"
              loading={loadingKpis}
            />
            <DashboardKpiCard
              label="Margem estimada"
              value={formatBRL(margin)}
              hint="Receita − custos"
              icon={CircleDollarSign}
              tone={margin >= 0 ? "success" : "danger"}
              loading={loadingKpis}
            />
            <DashboardKpiCard
              label="Pendências financeiras"
              value={String(kpis?.financial_pending ?? 0)}
              hint="Lançamentos em aberto"
              icon={AlertTriangle}
              tone={(kpis?.financial_pending ?? 0) > 0 ? "warning" : "default"}
              loading={loadingKpis}
            />
          </div>
        </section>
      )}

      {/* Gráficos — layout em 3 colunas */}
      <section className="grid gap-6 lg:grid-cols-3">

        {/* Coluna principal: revenue area chart */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {canFinance ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Receita — últimos 30 dias</CardTitle>
                    <CardDescription>Receitas pagas registradas no financeiro</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/financeiro">
                      Ver financeiro
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  {revenueChartData.length === 0 ? (
                    <EmptyChart label="Sem receitas no período" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={revenueChartData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
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
                          labelFormatter={(label) => String(label)}
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
                          fill="url(#revenueGradient)"
                          dot={false}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Usuário sem acesso financeiro: mostra status de fretes como gráfico principal */
            <FreightStatusChartCard data={statusChartData} total={totalFreights} />
          )}

          {/* Fretes recentes inline */}
          <DashboardRecentFreights />
        </div>

        {/* Coluna lateral: status + caixa */}
        <div className="flex flex-col gap-6">
          {/* Status breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Fretes por status</CardTitle>
                  <CardDescription>
                    {totalFreights > 0 ? `${totalFreights} total` : "Sem fretes"}
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
              {statusChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum frete cadastrado</p>
              ) : (
                <div className="space-y-3">
                  {/* Mini donut */}
                  <div className="mx-auto h-[140px] w-full max-w-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          dataKey="count"
                          nameKey="label"
                          innerRadius="58%"
                          outerRadius="80%"
                          paddingAngle={2}
                        >
                          {statusChartData.map((entry) => (
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

                  {/* Progress bars */}
                  <div className="space-y-2.5">
                    {statusChartData.map((row) => {
                      const pct = totalFreights > 0
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
                            <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
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

          {/* Fluxo de caixa */}
          {canFinance && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Fluxo de caixa</CardTitle>
                    <CardDescription>Consolidado do financeiro</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/financeiro">Abrir</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCashFlow ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <CashFlowRow
                      label="Receitas"
                      value={formatBRL(cashFlow?.total_receitas ?? 0)}
                      variant="positive"
                    />
                    <CashFlowRow
                      label="Despesas"
                      value={formatBRL(cashFlow?.total_despesas ?? 0)}
                      variant="negative"
                    />
                    <Separator />
                    <CashFlowRow
                      label="Saldo"
                      value={formatBRL(cashFlow?.saldo ?? 0)}
                      variant={(cashFlow?.saldo ?? 0) >= 0 ? "positive" : "negative"}
                      bold
                    />
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
                        <p className="text-xs text-muted-foreground">A receber</p>
                        <p className="text-sm font-semibold tabular-nums text-green-700 dark:text-green-400">
                          {formatBRL(cashFlow?.receitas_pendentes ?? 0)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
                        <p className="text-xs text-muted-foreground">A pagar</p>
                        <p className="text-sm font-semibold tabular-nums text-destructive">
                          {formatBRL(cashFlow?.despesas_pendentes ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Se não tem finance, mostra status chart aqui */}
          {canFinance && (
            <FreightStatusChartCard data={statusChartData} total={totalFreights} compact />
          )}
        </div>
      </section>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  )
}

function FreightStatusChartCard({
  data,
  total,
  compact,
}: {
  data: { status: string; label: string; count: number }[]
  total: number
  compact?: boolean
}) {
  if (compact) return null
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Distribuição de fretes</CardTitle>
        <CardDescription>
          {total > 0 ? `${total} fretes no total` : "Sem fretes cadastrados"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          {data.length === 0 ? (
            <EmptyChart label="Sem dados para exibir" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v: number) => [`${v} frete(s)`, "Quantidade"]}
                  labelFormatter={(l) => String(l)}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-chart-1)"
                  fill="var(--color-chart-1)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CashFlowRow({
  label,
  value,
  variant = "default",
  bold,
}: {
  label: string
  value: string
  variant?: "default" | "positive" | "negative"
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className={cn("text-sm text-muted-foreground", bold && "font-medium text-foreground")}>
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          bold ? "text-base font-bold" : "text-sm font-medium",
          variant === "positive" && "text-green-700 dark:text-green-400",
          variant === "negative" && "text-destructive",
        )}
      >
        {value}
      </span>
    </div>
  )
}
