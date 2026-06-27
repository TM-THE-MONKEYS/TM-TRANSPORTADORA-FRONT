"use client"

import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowRight, MapPin, Upload } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { FreightStatusBadge } from "@/components/fretes/freight-status-badge"
import { DeliveryChecklist } from "@/components/fretes/delivery-checklist"
import { FreightExpensesList } from "@/components/shared/freight-expenses-list"
import {
  addOccurrence,
  advanceFreightStatus,
  getFreight,
  getFreightEvents,
  getFreightOccurrences,
  updateFreight,
} from "@/lib/api/services/freight"
import { getTrackingTimeline } from "@/lib/api/services/tracking"
import { trackingUpdatesWithoutOccurrences } from "@/lib/freight/occurrences"
import { formatBRL } from "@/lib/format/currency"
import { formatDateTimeBR } from "@/lib/format/dates"
import { FREIGHT_STATUS_FLOW } from "@/lib/freight/status"
import { formatFreightRouteShort, formatFreightRouteStops } from "@/lib/freight/route-label"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import { useOperationContext } from "@/hooks/use-operation-context"
import { cn } from "@/lib/utils"

const NONE = "__none__"

const TRACKING_STATUS_LABELS: Record<string, string> = {
  coletado:          "Coletado",
  em_transito:       "Em trânsito",
  saiu_para_entrega: "Saiu p/ entrega",
  tentativa_entrega: "Tentativa de entrega",
  entregue:          "Entregue",
  devolvido:         "Devolvido",
}

const TRACKING_STATUS_STYLES: Record<string, string> = {
  coletado:          "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  em_transito:       "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  saiu_para_entrega: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  tentativa_entrega: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  entregue:          "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  devolvido:         "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

export function FreightDetailView({ id }: { id: string }) {
  const canStatus = usePermission(PERMISSIONS.freightStatus)
  const canWrite = usePermission(PERMISSIONS.freightWrite)
  const { drivers, trucks } = useOperationContext()
  const { data: freight, mutate: mutateFreight } = useSWR(["freight", id], () => getFreight(id))
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
  const [savingAssign, setSavingAssign] = useState(false)

  if (!freight) return <Skeleton className="h-96 w-full" />

  async function handleAdvance() {
    try {
      await advanceFreightStatus(id)
      toast.success("Status atualizado")
      await mutateFreight()
      mutateEvents()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro")
    }
  }

  async function handleOccurrence() {
    if (!occDesc.trim()) return
    try {
      await addOccurrence(id, occType, occDesc)
      setOccDesc("")
      await mutateOcc()
      await mutate(["tracking-timeline", id])
      mutateEvents()
      toast.success("Ocorrência registrada e visível no rastreamento")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro")
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

  const flowIdx = FREIGHT_STATUS_FLOW.indexOf(freight.status)
  const driverName = drivers.find((d) => d.id === freight.driver_id)?.name
  const truck = trucks.find((t) => t.id === freight.truck_id)

  const routeStops = formatFreightRouteStops(freight)

  return (
    <div>
      <PageHeader
        title={freight.code}
        description={formatFreightRouteShort(freight)}
        actions={
          canStatus && flowIdx < FREIGHT_STATUS_FLOW.length - 1 ? (
            <Button onClick={handleAdvance}>
              Avançar status
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : null
        }
      />

      <div className="mb-6 flex flex-wrap gap-4">
        <FreightStatusBadge status={freight.status} />
        <span className="text-sm text-muted-foreground">{freight.cargo_description}</span>
        <span className="font-medium">{formatBRL(freight.value_brl)}</span>
        {isFreightInTransit(freight.status) && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
            Viagem em percurso
          </span>
        )}
      </div>

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
                      point.kind === "destination" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
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

      {canWrite && (
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
            {s}
            {i < FREIGHT_STATUS_FLOW.length - 1 && <ArrowRight className="h-3 w-3" />}
          </div>
        ))}
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="ocorrencias">Ocorrências</TabsTrigger>
          <TabsTrigger value="comprovantes">Comprovantes</TabsTrigger>
          <TabsTrigger value="custos">Custos / Abastecimento</TabsTrigger>
          <TabsTrigger value="rastreamento">Rastreamento</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
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
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select
                  className="flex h-9 w-full rounded-md border px-3 text-sm"
                  value={occType}
                  onChange={(e) => setOccType(e.target.value)}
                >
                  <option value="atraso">Atraso</option>
                  <option value="avaria">Avaria</option>
                  <option value="documentacao">Documentação</option>
                </select>
              </div>
              <Textarea value={occDesc} onChange={(e) => setOccDesc(e.target.value)} placeholder="Descrição" />
              <Button onClick={handleOccurrence}>Registrar ocorrência</Button>
              <p className="text-xs text-muted-foreground">
                Vinculada ao frete {freight.code}. Aparece aqui e na aba Rastreamento.
              </p>
            </CardContent>
          </Card>
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
        <TabsContent value="custos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Custos e abastecimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <FreightExpensesList freightId={id} />
              <Link
                href="/dashboard/abastecimento"
                className="mt-4 inline-block text-sm text-primary hover:underline"
              >
                Registrar abastecimento →
              </Link>
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
                          TRACKING_STATUS_STYLES[upd.status] ?? "bg-muted text-muted-foreground",
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
        <TabsContent value="checklist" className="mt-4">
          <DeliveryChecklist freightId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
