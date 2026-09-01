"use client"

import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, MapPin, Trash2, Upload } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { FreightStatusBadge } from "@/components/fretes/freight-status-badge"
import { FreightClosedAdminPanel } from "@/components/fretes/freight-closed-admin-panel"
import { FreightAddCostForm } from "@/components/fretes/freight-add-cost-form"
import { FreightFinancialBreakdown } from "@/components/fretes/freight-financial-breakdown"
import { FreightExpensesList } from "@/components/shared/freight-expenses-list"
import {
  addFreightCost,
  addOccurrence,
  deleteFreight,
  getFreight,
  getFreightEvents,
  getFreightOccurrences,
  updateFreight,
  updateFreightStatus,
} from "@/lib/api/services/freight"
import { getTrackingTimeline } from "@/lib/api/services/tracking"
import { trackingUpdatesWithoutOccurrences } from "@/lib/freight/occurrences"
import { formatBRL } from "@/lib/format/currency"
import { formatDateTimeBR } from "@/lib/format/dates"
import { formatMoneyInput, parseMoneyInput } from "@/lib/format/numbers"
import { MANUAL_FREIGHT_COST_TYPES } from "@/lib/freight/costs"
import { FREIGHT_STATUS_FLOW, FREIGHT_STATUS_LABELS } from "@/lib/freight/status"
import {
  statusSoftClass,
  TRACKING_STATUS_TONE,
} from "@/lib/ui/status-colors"
import {
  ADMIN_FREIGHT_STATUS_OPTIONS,
  canAdminManageClosedFreight,
  isFreightClosed,
} from "@/lib/freight/closed-freight"
import { formatFreightRouteShort, formatFreightRouteStops } from "@/lib/freight/route-label"
import { isFreightInTransit } from "@/lib/freight/active-trip"
import { useAuth } from "@/components/providers/auth-provider"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import { useOperationContext } from "@/hooks/use-operation-context"
import { cn } from "@/lib/utils"
import type { FreightStatus } from "@/types"

const NONE = "__none__"

const TRACKING_STATUS_LABELS: Record<string, string> = {
  coletado:          "Coletado",
  em_transito:       "Em trânsito",
  saiu_para_entrega: "Saiu p/ entrega",
  tentativa_entrega: "Tentativa de entrega",
  entregue:          "Entregue",
  devolvido:         "Devolvido",
}

export function FreightDetailView({ id }: { id: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const canStatus = usePermission(PERMISSIONS.freightStatus)
  const canWrite = usePermission(PERMISSIONS.freightWrite)
  const isAdmin = canAdminManageClosedFreight(user?.role)
  const { drivers, trucks } = useOperationContext()
  const { data: freight, error: freightError, isLoading: freightLoading, mutate: mutateFreight } =
    useSWR(["freight", id], () => getFreight(id))
  const { data: events, mutate: mutateEvents } = useSWR(["freight-events", id], () =>
    getFreightEvents(id),
  )
  const { data: occurrences, mutate: mutateOcc } = useSWR(["freight-occ", id], () =>
    getFreightOccurrences(id),
  )
  const { data: trackingTimeline } = useSWR(["tracking-timeline", id], () =>
    getTrackingTimeline(id),
  )
  const trackingUpdates = trackingUpdatesWithoutOccurrences(trackingTimeline?.updates ?? [])
  const [occType, setOccType] = useState("atraso")
  const [occDesc, setOccDesc] = useState("")
  const [occCostEnabled, setOccCostEnabled] = useState(false)
  const [occCostTipo, setOccCostTipo] = useState("outro")
  const [occCostValorDisplay, setOccCostValorDisplay] = useState("")
  const [savingAssign, setSavingAssign] = useState(false)
  const [statusDraft, setStatusDraft] = useState<FreightStatus>("em_transporte")
  const [statusSaving, setStatusSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (freight?.status) setStatusDraft(freight.status)
  }, [freight?.status])

  if (freightError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Frete" description="Não foi possível carregar o frete." />
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm text-destructive">
              {freightError instanceof Error
                ? freightError.message
                : "Erro ao carregar dados do frete."}
            </p>
            <Button variant="outline" onClick={() => void mutateFreight()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (freightLoading || !freight) return <Skeleton className="h-96 w-full" />

  const flowIdx = FREIGHT_STATUS_FLOW.indexOf(freight.status)
  const closed = isFreightClosed(freight.status)
  const canEditClosed = closed && isAdmin
  const canAssign = canWrite && (!closed || isAdmin)
  const canAddOccurrence = !closed || isAdmin
  const canDelete = canWrite && (isAdmin || freight.status === "orcamento" || freight.status === "cancelado")
  const isLegacyStatus = !ADMIN_FREIGHT_STATUS_OPTIONS.some((opt) => opt.value === freight.status)
  const driverName = drivers.find((d) => d.id === freight.driver_id)?.name
  const truck = trucks.find((t) => t.id === freight.truck_id)
  const routeStops = formatFreightRouteStops(freight)

  async function handleOccurrence() {
    if (!occDesc.trim()) return

    const costValor = occCostEnabled ? parseMoneyInput(occCostValorDisplay) : null
    if (occCostEnabled && (costValor == null || costValor <= 0)) {
      toast.error("Informe um valor válido para o custo da ocorrência")
      return
    }

    try {
      await addOccurrence(id, occType, occDesc)

      if (occCostEnabled && costValor != null && costValor > 0) {
        await addFreightCost(id, {
          tipo: occCostTipo,
          valor: costValor,
          descricao: `Ocorrência (${occType}): ${occDesc.trim()}`,
        })
        void mutate(["freight-expenses", id])
        void mutate(["freight-breakdown-costs", id])
        void mutate(["freight-breakdown-finance", id])
        void mutate(["freight-breakdown", id])
      }

      setOccDesc("")
      setOccCostValorDisplay("")
      setOccCostEnabled(false)
      await mutateOcc()
      await mutate(["tracking-timeline", id])
      mutateEvents()
      toast.success(
        occCostEnabled && costValor
          ? `Ocorrência registrada com custo de ${formatBRL(costValor)}`
          : "Ocorrência registrada e visível no rastreamento",
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro")
    }
  }

  async function handleStatusApply() {
    if (statusDraft === freight!.status) return
    setStatusSaving(true)
    try {
      await updateFreightStatus(id, statusDraft)
      toast.success(`Status alterado para ${FREIGHT_STATUS_LABELS[statusDraft]}`)
      await mutateFreight()
      mutateEvents()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao alterar status")
    } finally {
      setStatusSaving(false)
    }
  }

  async function handleDeleteFreight() {
    setDeleting(true)
    try {
      await deleteFreight(id)
      toast.success("Frete excluído")
      router.push("/dashboard/fretes")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir frete")
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  async function handleAssign(driverId: string, truckId: string) {
    setSavingAssign(true)
    try {
      await updateFreight(id, {
        driver_id: driverId === NONE ? null : driverId,
        truck_id: truckId === NONE ? null : truckId,
      })
      toast.success("Motorista e veículo atualizados")
      mutateFreight()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao vincular")
    } finally {
      setSavingAssign(false)
    }
  }

  const statusSelectValue = statusDraft

  return (
    <div>
      <PageHeader
        title={freight.code}
        description={formatFreightRouteShort(freight)}
        density="compact"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canStatus && (
              <>
                <Select
                  value={statusSelectValue}
                  onValueChange={(v) => setStatusDraft(v as FreightStatus)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isLegacyStatus && (
                      <SelectItem value={freight.status} disabled>
                        {FREIGHT_STATUS_LABELS[freight.status]} (legado)
                      </SelectItem>
                    )}
                    {ADMIN_FREIGHT_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={statusDraft === freight.status || statusSaving}
                  onClick={handleStatusApply}
                >
                  {statusSaving ? "Salvando..." : "Alterar status"}
                </Button>
              </>
            )}
            {canDelete && (
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Excluir
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-4">
        <FreightStatusBadge status={freight.status} />
        <span className="text-sm text-muted-foreground">{freight.cargo_description}</span>
        <span className="font-medium">{formatBRL(freight.value_brl)}</span>
        {isFreightInTransit(freight.status) && (
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusSoftClass("progress"))}>
            Viagem em percurso
          </span>
        )}
      </div>

      {closed && !isAdmin && (
        <div className="mb-6 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Frete encerrado ({freight.status === "entregue" ? "entregue" : "cancelado"}). Edição
          restrita — contate um administrador para reabrir ou lançar gastos retroativos.
        </div>
      )}

      {canEditClosed && (
        <FreightClosedAdminPanel freight={freight} onUpdated={() => mutateFreight()} />
      )}

      {(freight.stops?.length ?? 0) > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Rota com paradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {routeStops.map((point, index) => (
                <li key={`${point.kind}-${point.sequence ?? index}`} className="flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      point.kind === "origin" && "bg-muted text-muted-foreground",
                      point.kind === "stop" && "bg-primary/15 text-primary",
                      point.kind === "destination" && "bg-status-success/15 text-status-success",
                    )}
                  >
                    {point.kind === "origin" ? "O" : point.kind === "destination" ? "F" : point.sequence}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {point.kind === "origin"
                        ? "Origem"
                        : point.kind === "destination"
                          ? "Destino final"
                          : `Parada ${point.sequence}`}
                    </p>
                    <p className="text-sm font-medium">{point.label}</p>
                    {point.detail && (
                      <p className="text-xs text-muted-foreground">{point.detail}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {canAssign && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Operação — motorista e veículo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Motorista</Label>
              <Select
                value={freight.driver_id ?? NONE}
                onValueChange={(v) => handleAssign(v, freight.truck_id ?? NONE)}
                disabled={savingAssign}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem motorista</SelectItem>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {driverName && (
                <Link href={`/dashboard/motoristas/${freight.driver_id}`} className="text-xs text-primary hover:underline">
                  Ver ficha do motorista
                </Link>
              )}
            </div>
            <div className="space-y-2">
              <Label>Caminhão</Label>
              <Select
                value={freight.truck_id ?? NONE}
                onValueChange={(v) => handleAssign(freight.driver_id ?? NONE, v)}
                disabled={savingAssign}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem veículo</SelectItem>
                  {trucks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.plate} — {t.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {truck && (
                <Link href={`/dashboard/frota/${freight.truck_id}`} className="text-xs text-primary hover:underline">
                  Ver ficha do caminhão
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex gap-1 overflow-x-auto pb-2">
        {FREIGHT_STATUS_FLOW.map((s, i) => (
          <div
            key={s}
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${
              i <= flowIdx ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {FREIGHT_STATUS_LABELS[s]}
            {i < FREIGHT_STATUS_FLOW.length - 1 && <ArrowRight className="h-3 w-3" />}
          </div>
        ))}
      </div>

      <FreightFinancialBreakdown freightId={id} className="mb-6" />

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="ocorrencias">Ocorrências</TabsTrigger>
          <TabsTrigger value="comprovantes">Comprovantes</TabsTrigger>
          <TabsTrigger value="custos">Custos / Abastecimento</TabsTrigger>
          <TabsTrigger value="rastreamento">Rastreamento</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico do frete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(events ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>
              ) : (
                (events ?? []).map((e) => (
                  <div key={e.id} className="border-l-2 border-primary pl-4">
                    <p className="font-medium">{e.title}</p>
                    {e.description && (
                      <p className="text-sm text-muted-foreground">{e.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{formatDateTimeBR(e.created_at)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ocorrencias" className="mt-4 space-y-4">
          {canAddOccurrence ? (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="occ-type">Tipo de ocorrência</Label>
                    <Select value={occType} onValueChange={setOccType}>
                      <SelectTrigger id="occ-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="atraso">Atraso</SelectItem>
                        <SelectItem value="avaria">Avaria</SelectItem>
                        <SelectItem value="documentacao">Documentação</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      O tipo de ocorrência será usado para categorizar a ocorrência e facilitar a busca.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occ-desc">Descrição</Label>
                  <Textarea
                    id="occ-desc"
                    value={occDesc}
                    onChange={(e) => setOccDesc(e.target.value)}
                    placeholder="Descreva o que ocorreu..."
                    rows={2}
                  />
                </div>

                {/* Optional cost link */}
                <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="occ-cost-enabled"
                      checked={occCostEnabled}
                      onCheckedChange={(checked) => {
                        const enabled = checked === true
                        setOccCostEnabled(enabled)
                        if (!enabled) setOccCostValorDisplay("")
                      }}
                    />
                    <Label htmlFor="occ-cost-enabled" className="cursor-pointer font-medium">
                      Vincular custo a esta ocorrência
                    </Label>
                  </div>

                  {occCostEnabled && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="occ-cost-tipo">Tipo de custo</Label>
                        <Select value={occCostTipo} onValueChange={setOccCostTipo}>
                          <SelectTrigger id="occ-cost-tipo">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MANUAL_FREIGHT_COST_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="occ-cost-valor">Valor (R$)</Label>
                        <Input
                          id="occ-cost-valor"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={occCostValorDisplay}
                          onChange={(e) =>
                            setOccCostValorDisplay(formatMoneyInput(e.target.value))
                          }
                        />
                      </div>
                      <p className="col-span-full text-xs text-muted-foreground">
                        O valor será lançado como custo real e descontará da margem do frete.
                        A descrição da ocorrência será usada como referência.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={handleOccurrence} disabled={!occDesc.trim()}>
                    Registrar ocorrência{occCostEnabled ? " + custo" : ""}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Vinculada ao frete {freight.code}. Aparece aqui e na aba Rastreamento.
                  {closed && isAdmin ? " Registro retroativo permitido (admin)." : ""}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                Frete encerrado — novas ocorrências só podem ser registradas por um administrador.
              </CardContent>
            </Card>
          )}
          {(occurrences ?? []).map((o) => (
            <Card key={o.id}>
              <CardContent className="pt-4">
                <p className="font-medium">{o.type}</p>
                <p className="text-sm">{o.description}</p>
                <p className="text-xs text-muted-foreground">{formatDateTimeBR(o.created_at)}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="comprovantes" className="mt-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Upload de fotos/comprovantes — POST /uploads/presign
              </p>
              <Button variant="outline" disabled>
                Enviar arquivo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="custos" className="mt-4 space-y-4">
          {!closed && (canWrite || isAdmin) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Lançar gasto da viagem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FreightAddCostForm
                  freightId={id}
                  onAdded={() => {}}
                />
                <p className="text-xs text-muted-foreground">
                  Para abastecimento com controle de litros e km, use{" "}
                  <Link
                    href="/dashboard/abastecimento"
                    className="text-primary hover:underline"
                  >
                    Abastecimento →
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de custos</CardTitle>
            </CardHeader>
            <CardContent>
              <FreightExpensesList freightId={id} />
              {canEditClosed && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Para gastos retroativos adicionais, use o painel administrativo acima.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rastreamento" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Atualizações de rastreamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trackingUpdates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma atualização de rastreamento registrada para este frete.
                </p>
              ) : (
                <ol className="relative space-y-4 border-l-2 border-primary/30 pl-6">
                  {[...trackingUpdates].reverse().map((upd) => (
                    <li key={upd.id} className="relative">
                      <span className="absolute -left-[1.625rem] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                          TRACKING_STATUS_TONE[upd.status]
                            ? statusSoftClass(TRACKING_STATUS_TONE[upd.status])
                            : "bg-muted text-muted-foreground",
                        )}>
                          {TRACKING_STATUS_LABELS[upd.status] ?? upd.status}
                        </span>
                        <time className="text-xs text-muted-foreground">
                          {formatDateTimeBR(upd.evento_at)}
                        </time>
                      </div>
                      {upd.observacao && (
                        <p className="mt-1 text-sm text-muted-foreground">{upd.observacao}</p>
                      )}
                      {(upd.latitude != null && upd.longitude != null) && (
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {upd.latitude.toFixed(5)}, {upd.longitude.toFixed(5)}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir frete</DialogTitle>
            <DialogDescription>
              O frete <strong>{freight.code}</strong> será removido (exclusão lógica). Custos,
              abastecimentos, pedágios e lançamentos financeiros vinculados também serão excluídos.
              Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteFreight} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir frete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
