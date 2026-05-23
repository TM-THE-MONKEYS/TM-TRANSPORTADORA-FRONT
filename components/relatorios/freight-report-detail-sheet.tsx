"use client"

import Link from "next/link"
import useSWR from "swr"
import { ExternalLink } from "lucide-react"
import { FreightStatusBadge } from "@/components/fretes/freight-status-badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getFreight,
  getFreightCosts,
  getFreightEvents,
  getFreightOccurrences,
} from "@/lib/api/services/freight"
import { listFinanceByFreight } from "@/lib/api/services/finance"
import { formatBRL } from "@/lib/format/currency"
import { formatWeightKg } from "@/lib/format/numbers"
import { formatDateBR, formatDateTimeBR } from "@/lib/format/dates"
import { buildFreightReportMetrics } from "@/lib/freight/report-metrics"
import { getDriverName, getTruckLabel } from "@/lib/freight/active-trip"
import { useOperationContext } from "@/hooks/use-operation-context"
import { cn } from "@/lib/utils"

type FreightReportDetailSheetProps = {
  freightId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FreightReportDetailSheet({
  freightId,
  open,
  onOpenChange,
}: FreightReportDetailSheetProps) {
  const { drivers, trucks } = useOperationContext()
  const id = freightId ?? ""

  const { data: freight, isLoading } = useSWR(open && id ? ["report-freight", id] : null, () =>
    getFreight(id),
  )
  const { data: events } = useSWR(open && id ? ["report-freight-events", id] : null, () =>
    getFreightEvents(id),
  )
  const { data: occurrences } = useSWR(open && id ? ["report-freight-occ", id] : null, () =>
    getFreightOccurrences(id),
  )
  const { data: costs } = useSWR(open && id ? ["report-freight-costs", id] : null, () =>
    getFreightCosts(id),
  )
  const { data: finance } = useSWR(open && id ? ["report-freight-finance", id] : null, () =>
    listFinanceByFreight(id),
  )

  const metricsReady =
    Boolean(freight) && events !== undefined && costs !== undefined && finance !== undefined

  const metrics =
    metricsReady && freight
      ? buildFreightReportMetrics(freight, events ?? [], costs ?? [], finance ?? [])
      : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto sm:max-w-xl">
        {isLoading || !freight ? (
          <div className="mt-8 space-y-3 pr-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="mt-6 space-y-6 pr-8">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold">{freight.code}</h2>
                <FreightStatusBadge status={freight.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {freight.origin_city}/{freight.origin_state} → {freight.destination_city}/
                {freight.destination_state}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/fretes/${freight.id}`}>
                  Abrir ficha completa
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            {metrics && (
              <section className="grid grid-cols-2 gap-2">
                <MetricCard label="Valor do frete" value={formatBRL(metrics.freightValue)} highlight />
                <MetricCard
                  label="Valor recebido"
                  value={formatBRL(metrics.receivedPaid)}
                  sub={
                    metrics.receivedPending > 0
                      ? `+ ${formatBRL(metrics.receivedPending)} pendente`
                      : undefined
                  }
                />
                <MetricCard label="Total gasto" value={formatBRL(metrics.totalSpent)} negative />
                <MetricCard
                  label="Margem estimada"
                  value={formatBRL(metrics.netMargin)}
                  sub={metrics.tripInProgress ? "Viagem em andamento" : undefined}
                  positive={metrics.netMargin >= 0}
                />
                <MetricCard
                  label="Tempo de trajeto"
                  value={metrics.tripDurationLabel}
                  className="col-span-2"
                />
              </section>
            )}

            <DetailSection title="Operação">
              <dl className="grid gap-2 text-sm">
                <Row label="Cliente" value={freight.customer_name ?? "—"} />
                <Row label="Carga" value={freight.cargo_description} />
                <Row label="Peso" value={formatWeightKg(freight.weight_kg)} />
                <Row label="Tipo" value={freight.freight_type} />
                <Row
                  label="Motorista"
                  value={
                    freight.driver_id
                      ? (getDriverName(drivers, freight.driver_id) ?? "—")
                      : "Não vinculado"
                  }
                />
                <Row
                  label="Veículo"
                  value={
                    freight.truck_id
                      ? (getTruckLabel(trucks, freight.truck_id) ?? "—")
                      : "Não vinculado"
                  }
                />
                <Row label="Prazo" value={formatDateBR(freight.deadline_at)} />
                <Row label="Criado em" value={formatDateTimeBR(freight.created_at)} />
                <Row label="Atualizado em" value={formatDateTimeBR(freight.updated_at)} />
              </dl>
            </DetailSection>

            <DetailSection title="Observações e ocorrências">
              {(occurrences ?? []).length === 0 && !freight.cargo_description ? (
                <p className="text-sm text-muted-foreground">Nenhuma observação registrada.</p>
              ) : null}
              {(occurrences ?? []).length > 0 && (
                <ul className="mt-3 space-y-2">
                  {(occurrences ?? []).map((o) => (
                    <li key={o.id} className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                      <span className="font-medium capitalize">{o.type}</span>
                      <p>{o.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTimeBR(o.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </DetailSection>

            <DetailSection title={`Custos e abastecimentos (${(costs ?? []).length})`}>
              {(costs ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum custo lançado neste frete.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {(costs ?? []).map((c) => (
                    <li
                      key={c.id}
                      className="flex items-start justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <div>
                        <p className="font-medium capitalize">{c.tipo}</p>
                        {c.descricao && (
                          <p className="text-muted-foreground">{c.descricao}</p>
                        )}
                        {c.litros != null && (
                          <p className="text-xs text-muted-foreground">{c.litros} L</p>
                        )}
                      </div>
                      <span className="shrink-0 font-medium text-destructive">
                        −{formatBRL(c.valor)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DetailSection>

            <DetailSection title="Financeiro (receitas e despesas)">
              {(finance ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem lançamentos financeiros. No módulo Financeiro, use &quot;Importar dos
                  fretes&quot; para gerar receitas e despesas de abastecimentos.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {(finance ?? []).map((e) => (
                    <li
                      key={e.id}
                      className="flex items-start justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">
                          {e.tipo === "receita" ? "Receita" : "Despesa"} — {e.categoria}
                        </p>
                        {e.descricao && (
                          <p className="text-muted-foreground">{e.descricao}</p>
                        )}
                        <p className="text-xs capitalize text-muted-foreground">{e.status}</p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 font-medium",
                          e.tipo === "receita" ? "text-green-700" : "text-destructive",
                        )}
                      >
                        {e.tipo === "receita" ? "+" : "−"}
                        {formatBRL(e.valor)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DetailSection>

            <DetailSection title="Linha do tempo">
              {(events ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem eventos registrados.</p>
              ) : (
                <ul className="space-y-3 border-l-2 border-primary/40 pl-4">
                  {(events ?? []).map((e) => (
                    <li key={e.id}>
                      <p className="font-medium text-sm">{e.title}</p>
                      {e.description && (
                        <p className="text-sm text-muted-foreground">{e.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDateTimeBR(e.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </DetailSection>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

function MetricCard({
  label,
  value,
  sub,
  highlight,
  negative,
  positive,
  className,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
  negative?: boolean
  positive?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        highlight && "border-primary/30 bg-primary/5",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-lg font-bold",
          negative && "text-destructive",
          positive === true && "text-green-700",
          positive === false && "text-destructive",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
