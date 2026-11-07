"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import useSWR from "swr"
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
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { QueryErrorState } from "@/components/shared/query-error-state"
import { ListFilterBar } from "@/components/shared/list-filter-bar"
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
import { formatBRL } from "@/lib/format/currency"
import { FREIGHT_STATUS_LABELS } from "@/lib/freight/status"
import { freightStatusChart } from "@/lib/ui/status-colors"
import { useCompetencia } from "@/hooks/use-competencia"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import { cn } from "@/lib/utils"
import type { DashboardFilters, FreightStatus } from "@/types"

function statusFill(status: string): string {
  if (status in FREIGHT_STATUS_LABELS) {
    return freightStatusChart(status as FreightStatus)
  }
  return "var(--color-chart-1)"
}

const chartSkeleton = (
  <Skeleton className="h-full min-h-[10rem] w-full rounded-lg bg-foreground/10" />
)

const DashboardRevenueChart = dynamic(
  () =>
    import("@/components/dashboard/dashboard-chart-widgets").then((m) => m.DashboardRevenueChart),
  { ssr: false, loading: () => chartSkeleton },
)

const StatusDonut = dynamic(
  () => import("@/components/dashboard/dashboard-chart-widgets").then((m) => m.StatusDonut),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="mx-auto h-[160px] w-full max-w-[240px] rounded-full bg-foreground/10" />
    ),
  },
)

const FreightStatusChartCard = dynamic(
  () =>
    import("@/components/dashboard/dashboard-chart-widgets").then((m) => m.FreightStatusChartCard),
  { ssr: false, loading: () => chartSkeleton },
)

/** Select translúcido sobre vidro (sem "caixa branca"). */
const GLASS_SELECT = "h-8 border-foreground/15 bg-background/60 text-xs"

/** Botão ghost discreto: hover neutro (o ghost padrão usa --accent verde). */
const GHOST_QUIET = "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"

const CARD_TITLE = "tracking-tight"

function formatChartDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

export function DashboardView() {
  const { branchId, branches } = useTenant()
  const { competencia, shift, canGoForward } = useCompetencia()
  const [filters, setFilters] = useState<DashboardFilters>({})
  const canFinance = usePermission(PERMISSIONS.financeRead)
  const canFreightWrite = usePermission(PERMISSIONS.freightWrite)

  const hasActiveFilters =
    Boolean(filters.branch_id) ||
    Boolean(filters.customer_id) ||
    Boolean(filters.truck_id) ||
    Boolean(filters.driver_id)

  function clearFilters() {
    setFilters({})
  }

  const kpiFilters: DashboardFilters = {
    ...filters,
    branch_id: branchId ?? filters.branch_id,
    competencia,
  }

  const { data: kpis, isLoading: loadingKpis, error: kpisError, mutate: retryKpis } = useSWR(
    [
      "dashboard-kpis",
      branchId,
      filters.branch_id,
      filters.customer_id,
      filters.truck_id,
      filters.driver_id,
      competencia.mes,
      competencia.ano,
    ],
    () => getDashboardKpis(kpiFilters),
  )
  const { data: byStatus, error: byStatusError } = useSWR(
    [
      "freights-by-status",
      competencia.mes,
      competencia.ano,
      filters.truck_id,
      filters.driver_id,
      filters.customer_id,
    ],
    () => getFreightsByStatus(kpiFilters),
  )
  const { data: revenue, error: revenueError } = useSWR(
    canFinance
      ? [
          "revenue-series",
          competencia.mes,
          competencia.ano,
          filters.truck_id,
          filters.driver_id,
        ]
      : null,
    () => getRevenueSeries(30),
  )
  const { data: customers } = useSWR("customers", listCustomers)
  const {
    data: cashFlow,
    isLoading: loadingCashFlow,
    error: cashFlowError,
    mutate: retryCashFlow,
  } = useSWR(
    canFinance
      ? [
          "dashboard-cash-flow",
          competencia.mes,
          competencia.ano,
          filters.truck_id,
          filters.driver_id,
        ]
      : null,
    () => getCashFlow(competencia, filters.truck_id, filters.driver_id),
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

  const monthlyRevenue = kpis?.monthly_revenue_brl ?? 0
  const margin = monthlyRevenue - (kpis?.operational_costs_brl ?? 0)
  const marginPct = monthlyRevenue > 0 ? (margin / monthlyRevenue) * 100 : null

  return (
    /*
     * Canvas neutro + vidro. Bleed compensando o p-4/p-6 do <main> do DashboardShell
     * (mesma técnica do HomeHub). Tokens `--glass-*` vivem em `.dashboard-canvas`.
     */
    <div className="dashboard-canvas -m-4 flex min-h-[calc(100vh-7.75rem)] flex-col p-2.5 md:-m-6 md:p-3 xl:p-4">
      <section className="grid flex-1 items-stretch gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] xl:grid-cols-[minmax(0,1.7fr)_minmax(22rem,0.85fr)] 2xl:grid-cols-[minmax(0,1.85fr)_minmax(24rem,0.75fr)] xl:gap-5">
        {/* Shell principal: um painel de vidro; blocos internos só com fundo translúcido */}
        <div className="glass @container flex min-w-0 flex-col gap-4 p-3.5 md:gap-5 md:p-4 xl:gap-6 xl:p-5">
          {/* Header */}
          <PageHeader
            className="mb-0"
            title="Dashboard operacional"
            description="Visão da operação, finanças e pendências em um só lugar"
            actions={
              canFreightWrite ? (
                <Button size="sm" asChild>
                  <Link href="/dashboard/fretes/novo">Novo frete</Link>
                </Button>
              ) : undefined
            }
          />

          {/* Filtros */}
          <div className="glass-subtle flex flex-wrap items-center gap-2 px-4 py-2.5">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Filtros
            </span>
            <Separator orientation="vertical" className="h-5 bg-foreground/15" />

            <ListFilterBar
              competencia={competencia}
              onCompetenciaShift={shift}
              nextDisabled={!canGoForward}
              driverId={filters.driver_id}
              onDriverChange={(id) => setFilters((f) => ({ ...f, driver_id: id }))}
              truckId={filters.truck_id}
              onTruckChange={(id) => setFilters((f) => ({ ...f, truck_id: id }))}
              showDriverFilter
              showTruckFilter
              showClear={false}
              variant="glass"
            />

            {branches.length > 0 && (
              <Select
                value={filters.branch_id ?? branchId ?? "all"}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, branch_id: v === "all" ? undefined : v }))
                }
              >
                <SelectTrigger className={cn(GLASS_SELECT, "w-[150px]")}>
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
              <SelectTrigger className={cn(GLASS_SELECT, "w-[180px]")}>
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

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 gap-1 px-2 text-xs", GHOST_QUIET)}
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
            {kpisError ? (
              <QueryErrorState
                description={kpisError instanceof Error ? kpisError.message : "Falha ao carregar KPIs."}
                onRetry={() => void retryKpis()}
              />
            ) : (
            <div className="grid gap-3 @sm:grid-cols-2 @3xl:grid-cols-4 md:gap-4">
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
            )}
          </section>

          {/* KPIs financeiros */}
          {canFinance && !kpisError && (
            <section>
              <SectionLabel>Financeiro</SectionLabel>
              <div className="grid gap-3 @sm:grid-cols-2 @3xl:grid-cols-4 md:gap-4">
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
                  value={
                    marginPct != null
                      ? `${formatBRL(margin)} (${marginPct.toLocaleString("pt-BR", {
                          maximumFractionDigits: 1,
                          minimumFractionDigits: 0,
                        })}%)`
                      : formatBRL(margin)
                  }
                  hint="Receita − custos · % sobre a receita"
                  icon={CircleDollarSign}
                  tone={margin >= 0 ? "success" : "danger"}
                  loading={loadingKpis}
                />
                <DashboardKpiCard
                  label="Pendências financeiras"
                  value={formatBRL(kpis?.financial_pending ?? 0)}
                  hint="Lançamentos em aberto"
                  icon={AlertTriangle}
                  tone={(kpis?.financial_pending ?? 0) > 0 ? "warning" : "default"}
                  loading={loadingKpis}
                />
              </div>
            </section>
          )}

          <div className="grid flex-1 gap-4 @4xl:grid-cols-2 md:gap-5">
            {canFinance ? (
              <Card variant="glass-subtle" size="sm" className="min-w-0">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className={CARD_TITLE}>Receita — últimos 30 dias</CardTitle>
                      <CardDescription>Receitas pagas registradas no financeiro</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className={GHOST_QUIET} asChild>
                      <Link href="/dashboard/financeiro">
                        Ver financeiro
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[min(22rem,42vh)] min-h-[16rem]">
                    <DashboardRevenueChart data={revenueChartData} error={revenueError} />
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Usuário sem acesso financeiro: mostra status de fretes como gráfico principal */
              <FreightStatusChartCard data={statusChartData} total={totalFreights} />
            )}

            <DashboardRecentFreights />
          </div>
        </div>

        {/* Coluna flutuante: status + caixa */}
        <aside className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:sticky lg:top-4 lg:grid-cols-1 lg:gap-5 lg:self-start xl:gap-6">
          {/* Status breakdown */}
          <Card variant="glass" size="sm" className="[--glass-tint:color-mix(in_oklch,var(--primary)_18%,transparent)]">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className={CARD_TITLE}>Fretes por status</CardTitle>
                  <CardDescription>
                    {totalFreights > 0 ? `${totalFreights} total` : "Sem fretes"}
                  </CardDescription>
                </div>
                {totalFreights > 0 && (
                  <Badge variant="secondary" className="bg-foreground/10 tabular-nums text-foreground">
                    {totalFreights}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {byStatusError ? (
                <p className="text-sm text-muted-foreground">Não foi possível carregar o status dos fretes.</p>
              ) : statusChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum frete cadastrado</p>
              ) : (
                <div className="space-y-3">
                  <StatusDonut
                    data={statusChartData}
                    dataKey={statusChartData.map((d) => `${d.status}:${d.count}`).join("|")}
                  />

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
                                    statusFill(row.status),
                                }}
                              />
                              <span className="text-xs">{row.label}</span>
                            </div>
                            <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                              {row.count} ({pct}%)
                            </span>
                          </div>
                          <StatusBar pct={pct} color={statusFill(row.status)} />
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
            <Card variant="glass" size="sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className={CARD_TITLE}>Fluxo de caixa</CardTitle>
                    <CardDescription>Consolidado do financeiro</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className={GHOST_QUIET} asChild>
                    <Link href="/dashboard/financeiro">Abrir</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {cashFlowError ? (
                  <div className="space-y-3 py-2 text-center">
                    <p className="text-sm text-muted-foreground">
                      {cashFlowError instanceof Error
                        ? cashFlowError.message
                        : "Falha ao carregar o fluxo de caixa."}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-foreground/15 bg-background/60"
                      onClick={() => void retryCashFlow()}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : loadingCashFlow ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-lg bg-foreground/10" />
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
                    <Separator className="bg-foreground/10" />
                    <CashFlowRow
                      label="Saldo"
                      value={formatBRL(cashFlow?.saldo ?? 0)}
                      variant={(cashFlow?.saldo ?? 0) >= 0 ? "positive" : "negative"}
                      bold
                    />
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="glass-subtle px-3 py-2 text-center">
                        <p className="text-xs text-muted-foreground">A receber</p>
                        <p className="text-sm font-semibold tabular-nums text-[var(--ink-positive)]">
                          {formatBRL(cashFlow?.receitas_pendentes ?? 0)}
                        </p>
                      </div>
                      <div className="glass-subtle px-3 py-2 text-center">
                        <p className="text-xs text-muted-foreground">A pagar</p>
                        <p className="text-sm font-semibold tabular-nums text-[var(--ink-negative)]">
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
        </aside>
      </section>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function StatusBar({ pct, color }: { pct: number; color: string }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    setWidth(0)
    const id = requestAnimationFrame(() => setWidth(pct))
    return () => cancelAnimationFrame(id)
  }, [pct])

  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-foreground/70">
      {children}
    </p>
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
          variant === "positive" && "text-[var(--ink-positive)]",
          variant === "negative" && "text-[var(--ink-negative)]",
        )}
      >
        {value}
      </span>
    </div>
  )
}
