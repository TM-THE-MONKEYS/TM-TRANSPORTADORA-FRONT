"use client"

import useSWR from "swr"
import { PageHeader } from "@/components/shared/page-header"
import { getDashboardKpis, getFreightsByStatus, getRevenueSeries } from "@/lib/api/services/dashboard"
import { formatBRL } from "@/lib/format/currency"

export function ReportsView() {
  const { data: kpis, isLoading: loadingKpis } = useSWR("reports-kpis", () => getDashboardKpis())
  const { data: byStatus } = useSWR("reports-freight-status", () => getFreightsByStatus())
  const { data: revenue } = useSWR("reports-revenue", () => getRevenueSeries(30))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="KPIs e séries do dashboard (/api/v1/dashboard)"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingKpis ? (
          <p className="text-muted-foreground text-sm">Carregando KPIs...</p>
        ) : (
          <>
            <ReportCard label="Fretes em andamento" value={String(kpis?.freights_in_progress ?? 0)} />
            <ReportCard label="Caminhões ativos" value={String(kpis?.active_trucks ?? 0)} />
            <ReportCard
              label="Receita mensal"
              value={formatBRL(kpis?.monthly_revenue_brl ?? 0)}
            />
            <ReportCard
              label="Custos operacionais"
              value={formatBRL(kpis?.operational_costs_brl ?? 0)}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Fretes por status</h2>
          <ul className="space-y-2 text-sm">
            {(byStatus ?? []).map((row) => (
              <li key={row.status} className="flex justify-between">
                <span className="text-muted-foreground">{row.status}</span>
                <span className="font-medium">{row.count}</span>
              </li>
            ))}
            {!byStatus?.length && (
              <li className="text-muted-foreground">Sem dados</li>
            )}
          </ul>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Receita — últimos 30 dias</h2>
          <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
            {(revenue ?? []).slice(-10).map((point) => (
              <li key={point.date} className="flex justify-between">
                <span className="text-muted-foreground">{point.date}</span>
                <span>{formatBRL(point.revenue)}</span>
              </li>
            ))}
            {!revenue?.length && <li className="text-muted-foreground">Sem dados</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}

function ReportCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  )
}
