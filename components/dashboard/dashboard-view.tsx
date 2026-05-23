"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card"
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions"
import { DashboardRecentFreights } from "@/components/dashboard/dashboard-recent-freights"
import { useTenant } from "@/components/providers/tenant-provider"
import {
  getDashboardKpis,
  getFreightsByStatus,
  getRevenueSeries,
} from "@/lib/api/services/dashboard"
import { getCashFlow } from "@/lib/api/services/finance"
import { listCustomers } from "@/lib/api/services/freight"
import { formatBRL } from "@/lib/format/currency"
import { FREIGHT_STATUS_LABELS } from "@/lib/freight/status"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import { cn } from "@/lib/utils"
import type { DashboardFilters, FreightStatus } from "@/types"

const STATUS_CHART_COLORS: Record<string, string> = {
  orcamento: "var(--color-chart-5)",
  confirmado: "var(--color-chart-1)",
  em_coleta: "var(--color-chart-3)",
  em_transporte: "var(--color-chart-2)",
  entregue: "oklch(0.65 0.15 145)",
  cancelado: "var(--color-destructive)",
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

  const swrKey = ["dashboard-kpis", branchId, filters] as const

  const { data: kpis, isLoading: loadingKpis } = useSWR(swrKey, () =>
    getDashboardKpis({ ...filters, branch_id: branchId ?? filters.branch_id }),
  )
  const { data: byStatus } = useSWR("freights-by-status", getFreightsByStatus)
  const { data: revenue } = useSWR("revenue-series", () => getRevenueSeries(30))
  const { data: customers } = useSWR("customers", listCustomers)
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

  const margin =
    (kpis?.monthly_revenue_brl ?? 0) - (kpis?.operational_costs_brl ?? 0)

  return (
    <div className="space-y-8">
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
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/relatorios">
                Relatórios
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">Filtros</span>
        <Select
          value={filters.branch_id ?? branchId ?? "all"}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, branch_id: v === "all" ? undefined : v }))
          }
        >
          <SelectTrigger className="w-[160px] bg-background">
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
        <Select
          value={filters.customer_id ?? "all"}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, customer_id: v === "all" ? undefined : v }))
          }
        >
          <SelectTrigger className="w-[200px] bg-background">
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
      </div>

      <DashboardQuickActions />

      {/* KPIs principais */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Resumo do dia
        </h2>
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

      {/* Financeiro */}
      {canFinance && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Indicadores financeiros
          </h2>
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

      {/* Gráficos + status breakdown */}
      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Distribuição de fretes</CardTitle>
            <CardDescription>
              {totalFreights > 0
                ? `${totalFreights} fretes no total`
                : "Sem fretes cadastrados"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              {statusChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sem dados para exibir
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={56}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value} frete(s)`, "Quantidade"]}
                      labelFormatter={(label) => String(label)}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {statusChartData.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_CHART_COLORS[entry.status] ?? "var(--color-chart-1)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Por status</CardTitle>
            <CardDescription>Participação na base</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum frete</p>
            ) : (
              statusChartData.map((row) => {
                const pct = totalFreights > 0 ? Math.round((row.count / totalFreights) * 100) : 0
                return (
                  <div key={row.status} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{row.label}</span>
                      <span className="font-medium tabular-nums">
                        {row.count}{" "}
                        <span className="text-muted-foreground">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            STATUS_CHART_COLORS[row.status] ?? "var(--color-chart-1)",
                        }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </section>

      {/* Receita + fluxo */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita — últimos 30 dias</CardTitle>
            <CardDescription>Receitas pagas registradas no financeiro</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {revenueChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Sem receitas no período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`
                    }
                  />
                  <Tooltip
                    formatter={(v: number) => [formatBRL(v), "Receita"]}
                    labelFormatter={(label) => String(label)}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {canFinance && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-base">Fluxo de caixa</CardTitle>
                <CardDescription>Consolidado do financeiro</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/financeiro">Abrir</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loadingCashFlow ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <CashFlowTile
                    label="Receitas"
                    value={formatBRL(cashFlow?.total_receitas ?? 0)}
                    variant="positive"
                  />
                  <CashFlowTile
                    label="Despesas"
                    value={formatBRL(cashFlow?.total_despesas ?? 0)}
                    variant="negative"
                  />
                  <CashFlowTile
                    label="Saldo"
                    value={formatBRL(cashFlow?.saldo ?? 0)}
                    variant={(cashFlow?.saldo ?? 0) >= 0 ? "positive" : "negative"}
                    className="col-span-2"
                  />
                  <CashFlowTile
                    label="A receber"
                    value={formatBRL(cashFlow?.receitas_pendentes ?? 0)}
                    sub
                  />
                  <CashFlowTile
                    label="A pagar"
                    value={formatBRL(cashFlow?.despesas_pendentes ?? 0)}
                    sub
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      <DashboardRecentFreights />
    </div>
  )
}

function CashFlowTile({
  label,
  value,
  variant = "default",
  sub,
  className,
}: {
  label: string
  value: string
  variant?: "default" | "positive" | "negative"
  sub?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        sub && "bg-muted/30",
        variant === "positive" && !sub && "border-green-500/20 bg-green-500/5",
        variant === "negative" && !sub && "border-destructive/20 bg-destructive/5",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-bold tabular-nums",
          variant === "positive" && "text-green-700 dark:text-green-400",
          variant === "negative" && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  )
}
