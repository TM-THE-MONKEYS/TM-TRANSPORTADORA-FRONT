"use client"

import { useEffect, useState } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBRL } from "@/lib/format/currency"
import { FREIGHT_STATUS_LABELS } from "@/lib/freight/status"
import { freightStatusChart } from "@/lib/ui/status-colors"
import type { FreightStatus } from "@/types"

function statusFill(status: string): string {
  if (status in FREIGHT_STATUS_LABELS) {
    return freightStatusChart(status as FreightStatus)
  }
  return "var(--color-chart-1)"
}

/** Tooltip Recharts com o vidro do dashboard (variáveis `--glass-*` do `.dashboard-canvas`). */
const chartTooltipProps = {
  contentStyle: {
    fontSize: 12,
    borderRadius: 12,
    border: "1px solid var(--glass-border)",
    background: "color-mix(in oklch, var(--glass-bg) 88%, transparent)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 8px 24px -8px var(--glass-shadow)",
    color: "var(--foreground)",
  } satisfies React.CSSProperties,
  labelStyle: { color: "var(--foreground)", fontWeight: 600 },
  itemStyle: { color: "var(--foreground)" },
}

const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" }

const chartGridProps = {
  vertical: false,
  stroke: "var(--foreground)",
  strokeOpacity: 0.08,
}

const CARD_TITLE = "tracking-tight"

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  )
}

/**
 * Donut com remount + animação só após mount (SWR/cache pulava o entrance do Recharts).
 */
export function StatusDonut({
  data,
  dataKey,
}: {
  data: { status: string; label: string; count: number }[]
  dataKey: string
}) {
  const [play, setPlay] = useState(false)

  useEffect(() => {
    setPlay(false)
    const id = requestAnimationFrame(() => setPlay(true))
    return () => cancelAnimationFrame(id)
  }, [dataKey])

  return (
    <div className="mx-auto h-[160px] w-full max-w-[240px]">
      {play ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart key={dataKey}>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={78}
              paddingAngle={2}
              stroke="none"
              isAnimationActive
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry) => (
                <Cell key={entry.status} fill={statusFill(entry.status)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, name: string) => [`${v} frete(s)`, name]}
              {...chartTooltipProps}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  )
}

export function DashboardRevenueChart({
  data,
  error,
}: {
  data: { date: string; revenue: number; label: string }[]
  error?: unknown
}) {
  if (error) return <EmptyChart label="Não foi possível carregar a receita" />
  if (data.length === 0) return <EmptyChart label="Sem receitas no período" />

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...chartGridProps} />
        <XAxis
          dataKey="label"
          tick={axisTick}
          interval="preserveStartEnd"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => (v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`)}
        />
        <Tooltip
          formatter={(v: number) => [formatBRL(v), "Receita"]}
          labelFormatter={(label) => String(label)}
          {...chartTooltipProps}
          cursor={{ stroke: "var(--foreground)", strokeOpacity: 0.2 }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-chart-2)"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
          animationDuration={650}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function FreightStatusChartCard({
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
    <Card variant="glass-subtle" size="sm">
      <CardHeader className="pb-2">
        <CardTitle className={CARD_TITLE}>Distribuição de fretes</CardTitle>
        <CardDescription>
          {total > 0 ? `${total} fretes no total` : "Sem fretes cadastrados"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[min(20rem,38vh)] min-h-[14rem]">
          {data.length === 0 ? (
            <EmptyChart label="Sem dados para exibir" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v: number) => [`${v} frete(s)`, "Quantidade"]}
                  labelFormatter={(l) => String(l)}
                  {...chartTooltipProps}
                  cursor={{ stroke: "var(--foreground)", strokeOpacity: 0.2 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-chart-1)"
                  fill="var(--color-chart-1)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  animationDuration={650}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { statusFill }
