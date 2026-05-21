"use client"

import useSWR from "swr"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Download, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import {
  getDashboardKpis,
  getFreightsByStatus,
  getRevenueSeries,
} from "@/lib/api/services/dashboard"
import { listCustomers } from "@/lib/api/services/freight"
import { formatBRL } from "@/lib/format/currency"
import { useTenant } from "@/components/providers/tenant-provider"
import { useState } from "react"
import type { DashboardFilters } from "@/types"

const kpiConfig = [
  { key: "freights_in_progress" as const, label: "Fretes em andamento" },
  { key: "active_trucks" as const, label: "Caminhões ativos" },
  { key: "available_drivers" as const, label: "Motoristas disponíveis" },
  { key: "monthly_revenue_brl" as const, label: "Receita do mês", format: "currency" },
  { key: "operational_costs_brl" as const, label: "Custos operacionais", format: "currency" },
  { key: "maintenance_alerts" as const, label: "Alertas manutenção" },
  { key: "financial_pending" as const, label: "Pendências financeiras" },
]

export function DashboardView() {
  const { branchId, branches } = useTenant()
  const [filters, setFilters] = useState<DashboardFilters>({})

  const { data: kpis, isLoading } = useSWR(
    ["dashboard-kpis", branchId, filters],
    () => getDashboardKpis({ ...filters, branch_id: branchId ?? undefined }),
  )
  const { data: byStatus } = useSWR("freights-by-status", getFreightsByStatus)
  const { data: revenue } = useSWR("revenue-series", getRevenueSeries)
  const { data: customers } = useSWR("customers", listCustomers)

  return (
    <div>
      <PageHeader
        title="Dashboard operacional"
        description="Visão executiva da operação logística"
        actions={
          <>
            <Button variant="outline" size="sm" disabled title="Aguardando API">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <Select
          value={filters.branch_id ?? branchId ?? "all"}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, branch_id: v === "all" ? undefined : v }))
          }
        >
          <SelectTrigger className="w-[160px]">
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
          <SelectTrigger className="w-[180px]">
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiConfig.map((k) => (
          <Card key={k.key}>
            <CardHeader className="pb-2">
              <CardDescription>{k.label}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">
                  {k.format === "currency"
                    ? formatBRL(kpis?.[k.key] ?? 0)
                    : (kpis?.[k.key] ?? 0)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fretes por status</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Receita — 30 dias</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip formatter={(v: number) => formatBRL(v)} />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de entregas
          </CardTitle>
          <CardDescription>Integração GPS — preparado para APIs de rastreamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground">
            Mapa em tempo real — conectar endpoint /tracking/map
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
