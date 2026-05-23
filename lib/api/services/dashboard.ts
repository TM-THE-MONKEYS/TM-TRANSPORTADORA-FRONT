import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import * as mock from "@/lib/mocks/handlers"
import type { DashboardFilters, DashboardKpis } from "@/types"

export async function getDashboardKpis(filters?: DashboardFilters): Promise<DashboardKpis> {
  if (shouldUseMocks()) return mock.mockDashboardKpis(filters)
  const qs = new URLSearchParams()
  if (filters?.period_from) qs.set("period_from", filters.period_from)
  if (filters?.period_to) qs.set("period_to", filters.period_to)
  if (filters?.branch_id) qs.set("branch_id", filters.branch_id)
  if (filters?.customer_id) qs.set("client_id", filters.customer_id)
  const q = qs.toString()
  return apiRequest(`/dashboard/kpis${q ? `?${q}` : ""}`, { auth: true })
}

export async function getFreightsByStatus(): Promise<{ status: string; count: number }[]> {
  if (shouldUseMocks()) {
    return [
      { status: "em_transporte", count: 3 },
      { status: "orcamento", count: 2 },
      { status: "em_coleta", count: 1 },
      { status: "entregue", count: 4 },
    ]
  }
  return apiRequest("/dashboard/freights-by-status", { auth: true })
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
