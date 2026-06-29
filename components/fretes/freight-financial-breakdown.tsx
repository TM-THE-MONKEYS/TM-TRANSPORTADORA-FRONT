"use client"

import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"
import { getFreight, getFreightCosts } from "@/lib/api/services/freight"
import { listFinanceByFreight } from "@/lib/api/services/finance"
import { buildFreightReportMetrics } from "@/lib/freight/report-metrics"
import { formatCommissionPct } from "@/lib/motoristas/driver-status"
import { formatBRL } from "@/lib/format/currency"
import { useOperationContext } from "@/hooks/use-operation-context"
import { cn } from "@/lib/utils"

type FreightFinancialBreakdownProps = {
  freightId: string
  className?: string
}

export function FreightFinancialBreakdown({ freightId, className }: FreightFinancialBreakdownProps) {
  const { drivers } = useOperationContext()

  const { data: freight, isLoading: loadingFreight } = useSWR(
    freightId ? ["freight-breakdown", freightId] : null,
    () => getFreight(freightId),
  )
  const { data: costs, isLoading: loadingCosts } = useSWR(
    freightId ? ["freight-breakdown-costs", freightId] : null,
    () => getFreightCosts(freightId),
  )
  const { data: finance, isLoading: loadingFinance } = useSWR(
    freightId ? ["freight-breakdown-finance", freightId] : null,
    () => listFinanceByFreight(freightId),
  )

  const loading = loadingFreight || loadingCosts || loadingFinance

  if (loading || !freight) {
    return <Skeleton className={cn("h-36 w-full", className)} />
  }

  const driver = freight.driver_id ? drivers.find((d) => d.id === freight.driver_id) : undefined
  const metrics = buildFreightReportMetrics(freight, [], costs ?? [], finance ?? [], driver)

  return (
    <div className={cn("rounded-lg border bg-muted/20 p-4", className)}>
      <p className="mb-3 text-sm font-semibold">Análise financeira do frete</p>
      <dl className="space-y-2 text-sm">
        <BreakdownRow label="Valor do frete" value={formatBRL(metrics.freightValue)} />
        {metrics.driverCommission > 0 && (
          <BreakdownRow
            label={
              metrics.driverCommissionEstimated
                ? `Comissão motorista (estimada${
                    driver?.commission_pct != null
                      ? ` · ${formatCommissionPct(driver.commission_pct)}`
                      : ""
                  })`
                : "Comissão motorista"
            }
            value={`−${formatBRL(metrics.driverCommission)}`}
            sub={driver?.name}
            negative
            muted={metrics.driverCommissionEstimated}
          />
        )}
        {metrics.totalCosts > 0 && (
          <BreakdownRow
            label="Custos operacionais"
            value={`−${formatBRL(metrics.totalCosts)}`}
            sub="Abastecimento, pedágio etc."
            negative
          />
        )}
        {metrics.otherExpenses > 0 && (
          <BreakdownRow
            label="Outras despesas"
            value={`−${formatBRL(metrics.otherExpenses)}`}
            negative
          />
        )}
        <div className="border-t pt-2">
          <BreakdownRow
            label="Margem estimada"
            value={formatBRL(metrics.netMargin)}
            strong
            positive={metrics.netMargin >= 0}
            negative={metrics.netMargin < 0}
          />
        </div>
      </dl>
      {metrics.driverCommission === 0 && !freight.driver_id && (
        <p className="mt-3 text-xs text-muted-foreground">
          Vincule um motorista com comissão para ver o desconto neste frete.
        </p>
      )}
      {metrics.driverCommission === 0 && freight.driver_id && driver?.commission_pct == null && (
        <p className="mt-3 text-xs text-muted-foreground">
          Motorista sem percentual de comissão cadastrado.
        </p>
      )}
    </div>
  )
}

function BreakdownRow({
  label,
  value,
  sub,
  strong,
  negative,
  positive,
  muted,
}: {
  label: string
  value: string
  sub?: string
  strong?: boolean
  negative?: boolean
  positive?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className={cn("text-muted-foreground", muted && "italic")}>
        {label}
        {sub && <span className="mt-0.5 block text-xs">{sub}</span>}
      </dt>
      <dd
        className={cn(
          "shrink-0 text-right font-medium tabular-nums",
          strong && "text-base font-bold",
          negative && !positive && "text-destructive",
          positive && "text-green-700 dark:text-green-400",
          positive === false && strong && "text-destructive",
        )}
      >
        {value}
      </dd>
    </div>
  )
}
