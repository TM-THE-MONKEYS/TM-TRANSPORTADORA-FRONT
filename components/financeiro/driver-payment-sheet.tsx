"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, User2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { CompetenciaNavigator } from "@/components/shared/competencia-navigator"
import { EntityFilterSelect } from "@/components/shared/entity-filter-select"
import { useOperationContext } from "@/hooks/use-operation-context"
import {
  invalidateFinanceCaches,
  listFinanceEntries,
  updateFinanceEntry,
} from "@/lib/api/services/finance"
import {
  DRIVER_COMMISSION_CATEGORY,
  filterCommissionEntriesForDriver,
  isCommissionPaid,
  isCommissionUnpaid,
} from "@/lib/freight/driver-commission"
import { getTruckLabel } from "@/lib/freight/active-trip"
import { formatBRL } from "@/lib/format/currency"
import { formatDateBR } from "@/lib/format/dates"
import { formatCommissionPct } from "@/lib/motoristas/driver-status"
import { SEMANTIC } from "@/lib/ui/status-colors"
import { cn } from "@/lib/utils"
import type { FinanceEntry, FreightOrder } from "@/types"

// ── Types ─────────────────────────────────────────────────────────────────────

interface DriverPaymentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDriverId?: string
}

interface CommissionRowProps {
  entry: FinanceEntry
  freight: FreightOrder | undefined
  commissionPct: number | undefined | null
  onMarkPaid: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentCompetencia() {
  const now = new Date()
  return { mes: now.getMonth() + 1, ano: now.getFullYear() }
}

function shiftCompetencia(
  c: { mes: number; ano: number },
  delta: -1 | 1,
): { mes: number; ano: number } {
  if (delta === -1) return c.mes === 1 ? { mes: 12, ano: c.ano - 1 } : { mes: c.mes - 1, ano: c.ano }
  return c.mes === 12 ? { mes: 1, ano: c.ano + 1 } : { mes: c.mes + 1, ano: c.ano }
}

/** Extrai código do frete do campo descricao quando o freight não está no op-context. */
function parseFreightCodeFromDescricao(descricao?: string): string | null {
  if (!descricao) return null
  const marker = "· frete "
  const idx = descricao.indexOf(marker)
  return idx !== -1 ? descricao.slice(idx + marker.length).trim() : null
}

function entryDate(entry: FinanceEntry): string {
  const iso = entry.data_vencimento ?? entry.data_pagamento ?? entry.created_at
  return formatDateBR(iso) ?? "—"
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyPlaceholder({
  icon: Icon,
  message,
}: {
  icon: React.ElementType
  message: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <Icon className="h-10 w-10 text-muted-foreground opacity-30" />
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: FinanceEntry["status"] }) {
  if (isCommissionPaid(status)) return <Badge variant="secondary">Pago</Badge>
  if (status === "cancelado") return <Badge variant="destructive">Cancelado</Badge>
  if (status === "vencido") return <Badge variant="destructive">Vencido</Badge>
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Pendente
    </Badge>
  )
}

function CommissionRow({ entry, freight, commissionPct, onMarkPaid }: CommissionRowProps) {
  const [paying, setPaying] = useState(false)

  const code = freight?.code ?? parseFreightCodeFromDescricao(entry.descricao) ?? "—"
  const route =
    freight
      ? `${freight.origin_city} → ${freight.destination_city}`
      : entry.descricao ?? "—"
  const freightValue = freight?.value_brl

  async function handlePay() {
    setPaying(true)
    try {
      await onMarkPaid()
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-6 py-4">
      {/* Left — freight info */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-mono text-xs font-semibold text-foreground">{code}</span>
          <span className="text-xs text-muted-foreground">{route}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>{entryDate(entry)}</span>
          {freightValue != null && (
            <span>Frete: {formatBRL(freightValue)}</span>
          )}
          {commissionPct != null && (
            <span>{formatCommissionPct(commissionPct)}</span>
          )}
        </div>
      </div>

      {/* Right — value + status + action */}
      <div className="flex flex-col items-end gap-1.5">
        <span className={cn("tabular-nums font-semibold", SEMANTIC.negative)}>
          {formatBRL(entry.valor)}
        </span>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={entry.status} />
          {isCommissionUnpaid(entry.status) && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs"
              disabled={paying}
              onClick={handlePay}
            >
              {paying ? "…" : "Pagar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DriverPaymentSheet({
  open,
  onOpenChange,
  initialDriverId,
}: DriverPaymentSheetProps) {
  const [driverId, setDriverId] = useState<string | undefined>(initialDriverId)
  const [truckId, setTruckId] = useState<string | undefined>()
  const [competencia, setCompetencia] = useState(currentCompetencia)
  const [markingAll, setMarkingAll] = useState(false)

  const { trucks, drivers, freights } = useOperationContext()

  useEffect(() => {
    if (open) {
      setDriverId(initialDriverId)
      setTruckId(undefined)
    }
  }, [open, initialDriverId])

  // Ao trocar motorista, limpa filtro de caminhão (lista muda).
  useEffect(() => {
    setTruckId(undefined)
  }, [driverId])

  const swrKey = driverId
    ? ["driver-commission-entries", competencia.mes, competencia.ano]
    : null

  const {
    data: entriesPage,
    isLoading,
    mutate: refreshEntries,
  } = useSWR(
    swrKey,
    () =>
      // Não envia driver_id/truck_id à API: atribuição histórica fica na descrição.
      // Se o frete trocar de motorista depois, o JOIN atual erraria o dono da comissão.
      listFinanceEntries(
        1,
        100,
        "despesa",
        undefined,
        undefined,
        competencia,
        undefined,
        undefined,
        DRIVER_COMMISSION_CATEGORY,
      ),
    { keepPreviousData: false },
  )

  const driver = driverId ? drivers.find((d) => d.id === driverId) : undefined

  const commissionEntries = useMemo(() => {
    if (!driverId || !driver?.name) return []
    return filterCommissionEntriesForDriver(entriesPage?.items ?? [], freights, driverId, {
      driverName: driver.name,
      truckId,
    })
  }, [entriesPage, freights, driverId, truckId, driver?.name])

  const unpaidEntries = useMemo(
    () => commissionEntries.filter((e) => isCommissionUnpaid(e.status)),
    [commissionEntries],
  )
  const paidEntries = useMemo(
    () => commissionEntries.filter((e) => isCommissionPaid(e.status)),
    [commissionEntries],
  )

  const pending = useMemo(
    () => unpaidEntries.reduce((s, e) => s + e.valor, 0),
    [unpaidEntries],
  )
  const paid = useMemo(
    () => paidEntries.reduce((s, e) => s + e.valor, 0),
    [paidEntries],
  )
  const total = pending + paid
  const pendingCount = unpaidEntries.length

  const driverItems = useMemo(
    () => drivers.map((d) => ({ id: d.id, label: d.name })),
    [drivers],
  )

  // Caminhões que aparecem nos fretes das comissões deste motorista (não a frota inteira).
  const truckItems = useMemo(() => {
    if (!driverId || !driver?.name) return []
    const forDriver = filterCommissionEntriesForDriver(
      entriesPage?.items ?? [],
      freights,
      driverId,
      { driverName: driver.name },
    )
    const truckIds = new Set<string>()
    for (const e of forDriver) {
      const f = freights.find((x) => x.id === e.freight_id)
      if (f?.truck_id) truckIds.add(f.truck_id)
    }
    return trucks
      .filter((t) => truckIds.has(t.id))
      .map((t) => ({
        id: t.id,
        label: getTruckLabel(trucks, t.id) ?? t.plate,
      }))
  }, [entriesPage, freights, trucks, driverId, driver?.name])

  function todayISODate() {
    return new Date().toISOString().slice(0, 10)
  }

  async function handleMarkPaid(entry: FinanceEntry) {
    await updateFinanceEntry(entry.id, {
      status: "pago",
      data_pagamento: todayISODate(),
    })
    invalidateFinanceCaches()
    await refreshEntries()
    toast.success("Comissão marcada como paga")
  }

  async function handleMarkAllPaid() {
    if (unpaidEntries.length === 0) return
    setMarkingAll(true)
    const paymentDate = todayISODate()
    try {
      await Promise.all(
        unpaidEntries.map((e) =>
          updateFinanceEntry(e.id, { status: "pago", data_pagamento: paymentDate }),
        ),
      )
      invalidateFinanceCaches()
      await refreshEntries()
      toast.success(`${unpaidEntries.length} comissão(ões) marcada(s) como paga(s)`)
    } catch {
      toast.error("Erro ao marcar comissões como pagas")
    } finally {
      setMarkingAll(false)
    }
  }

  const showNoCommissionPct = Boolean(driver && driver.commission_pct == null)
  const showContent = Boolean(driverId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        {/* Header */}
        <div className="border-b px-6 py-4 pr-12">
          <h2 className="text-lg font-semibold">Fechamento de Comissões</h2>
          <p className="text-sm text-muted-foreground">
            Confira e marque como pagas as comissões por carga de cada motorista.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b px-6 py-3">
          <EntityFilterSelect
            value={driverId}
            onValueChange={setDriverId}
            items={driverItems}
            allLabel="Selecione um motorista"
            className="w-[200px]"
          />
          <EntityFilterSelect
            value={truckId}
            onValueChange={setTruckId}
            items={truckItems}
            allLabel="Todos caminhões"
            className="w-[170px]"
            disabled={!driverId || truckItems.length === 0}
          />
          <CompetenciaNavigator
            mes={competencia.mes}
            ano={competencia.ano}
            onPrevious={() => setCompetencia((c) => shiftCompetencia(c, -1))}
            onNext={() => setCompetencia((c) => shiftCompetencia(c, 1))}
          />
          {truckId && (
            <p className="basis-full text-xs text-muted-foreground">
              Caminhão refina pelas cargas atuais do frete — a comissão continua do motorista
              registrado no lançamento.
            </p>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {!driverId ? (
            <EmptyPlaceholder
              icon={User2}
              message="Selecione um motorista para ver o fechamento de comissões."
            />
          ) : (
            <>
              {showNoCommissionPct && (
                <div className="m-6 mb-0 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/40 dark:bg-yellow-900/20">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Motorista sem percentual de comissão
                    </p>
                    <p className="mt-0.5 text-sm text-yellow-700 dark:text-yellow-400">
                      Cadastre o percentual no perfil do motorista para que novas comissões
                      sejam geradas ao marcar fretes como entregues.
                    </p>
                  </div>
                </div>
              )}
              {isLoading ? (
                <div className="space-y-px p-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-[72px] w-full rounded-none first:rounded-t-lg last:rounded-b-lg"
                    />
                  ))}
                </div>
              ) : commissionEntries.length === 0 ? (
                <EmptyPlaceholder
                  icon={CheckCircle2}
                  message="Nenhuma comissão encontrada neste período para este motorista."
                />
              ) : (
                <div className="divide-y">
                  {commissionEntries.map((entry) => (
                    <CommissionRow
                      key={entry.id}
                      entry={entry}
                      freight={freights.find((f) => f.id === entry.freight_id)}
                      commissionPct={driver?.commission_pct}
                      onMarkPaid={() => handleMarkPaid(entry)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Summary bar + footer action */}
        {showContent && commissionEntries.length > 0 && (
          <>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t bg-muted/20 px-6 py-3 text-sm">
              <span>
                A pagar{" "}
                <strong
                  className={cn(
                    "tabular-nums",
                    pending > 0 ? SEMANTIC.negative : "text-foreground",
                  )}
                >
                  {formatBRL(pending)}
                </strong>
                {pendingCount > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({pendingCount} {pendingCount === 1 ? "carga" : "cargas"})
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">·</span>
              <span>
                Pago{" "}
                <strong className={cn("tabular-nums", SEMANTIC.positive)}>
                  {formatBRL(paid)}
                </strong>
              </span>
              <span className="text-muted-foreground">·</span>
              <span>
                Total <strong className="tabular-nums">{formatBRL(total)}</strong>
              </span>
            </div>

            {pendingCount > 0 && (
              <div className="border-t px-6 py-3">
                <Button
                  className="w-full"
                  onClick={handleMarkAllPaid}
                  disabled={markingAll}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {markingAll
                    ? "Processando…"
                    : `Marcar ${pendingCount} ${pendingCount === 1 ? "comissão" : "comissões"} como Pago`}
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
