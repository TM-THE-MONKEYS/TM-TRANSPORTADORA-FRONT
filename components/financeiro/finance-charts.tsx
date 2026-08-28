"use client"

import { useMemo } from "react"
import useSWR from "swr"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"
import { getCashFlow } from "@/lib/api/services/finance"
import { formatBRL } from "@/lib/format/currency"
import { FINANCE_STATUS_TONE, STATUS_TONE } from "@/lib/ui/status-colors"
import { cn } from "@/lib/utils"
import type { CashFlowSummary, FinanceEntry } from "@/types"

/** Paleta de cores para categorias, usando CSS vars semânticas do projeto. */
const CATEGORY_COLORS = [
  STATUS_TONE.info.chart,
  STATUS_TONE.warning.chart,
  STATUS_TONE.progress.chart,
  STATUS_TONE.caution.chart,
  STATUS_TONE.danger.chart,
  STATUS_TONE.neutral.chart,
  STATUS_TONE.success.chart,
]

interface FinanceChartsProps {
  entries: FinanceEntry[]
  cashFlow: CashFlowSummary | undefined
  competencia: { mes: number; ano: number }
}

function prevCompetencia(comp: { mes: number; ano: number }) {
  return comp.mes === 1
    ? { mes: 12, ano: comp.ano - 1 }
    : { mes: comp.mes - 1, ano: comp.ano }
}

function pctChange(current: number, prev: number): number | null {
  if (prev === 0) return null
  return ((current - prev) / Math.abs(prev)) * 100
}

export function FinanceCharts({ entries, cashFlow, competencia }: FinanceChartsProps) {
  const prevComp = prevCompetencia(competencia)

  const { data: prevCashFlow } = useSWR(
    ["cash-flow", prevComp.mes, prevComp.ano],
    () => getCashFlow(prevComp),
    { keepPreviousData: true },
  )

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of entries) {
      if (e.tipo !== "despesa" || e.status === "cancelado") continue
      map[e.categoria] = (map[e.categoria] ?? 0) + e.valor
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [entries])

  const saldoChange = pctChange(cashFlow?.saldo ?? 0, prevCashFlow?.saldo ?? 0)
  const currentSaldo = cashFlow?.saldo ?? 0
  const prevSaldo = prevCashFlow?.saldo ?? 0

  if (categoryData.length === 0 && !prevCashFlow) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Breakdown por categoria */}
      {categoryData.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-3 text-sm font-medium">Despesas por categoria</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={categoryData}
              layout="vertical"
              margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatBRL(value), "Despesa"]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--popover))",
                  color: "hsl(var(--popover-foreground))",
                }}
                cursor={{ fill: "hsl(var(--muted))" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {categoryData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comparação de saldo com mês anterior */}
      {prevCashFlow && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Saldo vs mês anterior</p>
          <div className="space-y-2">
            <SaldoRow label="Mês atual" value={currentSaldo} />
            <SaldoRow label="Mês anterior" value={prevSaldo} dim />
          </div>
          {saldoChange !== null && (
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium",
                saldoChange > 0
                  ? "bg-status-success/10 text-status-success"
                  : saldoChange < 0
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {saldoChange > 0 ? (
                <TrendingUp className="h-4 w-4 shrink-0" />
              ) : saldoChange < 0 ? (
                <TrendingDown className="h-4 w-4 shrink-0" />
              ) : (
                <Minus className="h-4 w-4 shrink-0" />
              )}
              <span>
                {saldoChange > 0 ? "+" : ""}
                {saldoChange.toFixed(1)}% em relação ao mês anterior
              </span>
            </div>
          )}
          {/* Receitas vs Despesas */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="space-y-0.5">
              <p className="text-muted-foreground">Receitas</p>
              <p className="font-semibold tabular-nums text-status-success">
                {formatBRL(cashFlow?.total_receitas ?? 0)}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-muted-foreground">Despesas</p>
              <p className="font-semibold tabular-nums text-destructive">
                {formatBRL(cashFlow?.total_despesas ?? 0)}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-muted-foreground">Pendentes</p>
              <p className="tabular-nums">
                {formatBRL(
                  (cashFlow?.receitas_pendentes ?? 0) + (cashFlow?.despesas_pendentes ?? 0),
                )}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-muted-foreground">Pagos/recebidos</p>
              <p className="tabular-nums">
                {formatBRL(
                  (cashFlow?.receitas_pagas ?? 0) + (cashFlow?.despesas_pagas ?? 0),
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SaldoRow({
  label,
  value,
  dim,
}: {
  label: string
  value: number
  dim?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-sm", dim ? "text-muted-foreground" : "text-foreground")}>
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums text-sm font-semibold",
          dim ? "text-muted-foreground" : value >= 0 ? "text-status-success" : "text-destructive",
        )}
      >
        {formatBRL(value)}
      </span>
    </div>
  )
}
