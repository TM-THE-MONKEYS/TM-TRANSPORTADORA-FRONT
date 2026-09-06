import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import * as mock from "@/lib/mocks/handlers"
import type { DashboardFilters, DashboardKpis } from "@/types"

function dashboardFiltersQuery(filters?: DashboardFilters): string {
  const qs = new URLSearchParams()
  if (filters?.period_from) qs.set("period_from", filters.period_from)
  if (filters?.period_to) qs.set("period_to", filters.period_to)
  if (filters?.branch_id) qs.set("branch_id", filters.branch_id)
  if (filters?.customer_id) qs.set("client_id", filters.customer_id)
  if (filters?.truck_id) qs.set("truck_id", filters.truck_id)
  if (filters?.driver_id) qs.set("driver_id", filters.driver_id)
  if (filters?.competencia) {
    qs.set("competencia_mes", String(filters.competencia.mes))
    qs.set("competencia_ano", String(filters.competencia.ano))
  }
  return qs.toString()
}

export async function getDashboardKpis(filters?: DashboardFilters): Promise<DashboardKpis> {
  if (shouldUseMocks()) return mock.mockDashboardKpis(filters)
  const q = dashboardFiltersQuery(filters)
  return apiRequest(`/dashboard/kpis${q ? `?${q}` : ""}`, { auth: true })
}

export async function getFreightsByStatus(
  filters?: DashboardFilters,
): Promise<{ status: string; count: number }[]> {
  if (shouldUseMocks()) {
    return [
      { status: "em_transporte", count: 3 },
      { status: "orcamento", count: 2 },
      { status: "em_coleta", count: 1 },
      { status: "entregue", count: 4 },
    ]
  }
  const q = dashboardFiltersQuery(filters)
  return apiRequest(`/dashboard/freights-by-status${q ? `?${q}` : ""}`, { auth: true })
}

export async function getRevenueSeries(days = 30): Promise<{ date: string; revenue: number }[]> {
  if (shouldUseMocks()) {
    return Array.from({ length: days }, (_, i) => ({
      date: `2026-04-${String(Math.min(21 + i, 30)).padStart(2, "0")}`,
      revenue: 8000 + Math.random() * 4000,
    }))
  }
  return apiRequest(`/dashboard/revenue-series?days=${days}`, { auth: true })
}
