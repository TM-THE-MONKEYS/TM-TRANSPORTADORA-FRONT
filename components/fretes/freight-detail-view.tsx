"use client"

import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowRight, Upload } from "lucide-react"
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
import {
  addOccurrence,
  advanceFreightStatus,
  getFreight,
  getFreightEvents,
  getFreightOccurrences,
  updateFreight,
} from "@/lib/api/services/freight"
import { formatBRL } from "@/lib/format/currency"
import { formatDateTimeBR } from "@/lib/format/dates"
import { FREIGHT_STATUS_FLOW } from "@/lib/freight/status"
import { isFreightInTransit } from "@/lib/freight/active-trip"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import { useOperationContext } from "@/hooks/use-operation-context"

const NONE = "__none__"

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
  const [occType, setOccType] = useState("atraso")
  const [occDesc, setOccDesc] = useState("")
  const [savingAssign, setSavingAssign] = useState(false)

  if (!freight) return <Skeleton className="h-96 w-full" />

  async function handleAdvance() {
    try {
      await advanceFreightStatus(id)
      toast.success("Status atualizado")
      mutateFreight()
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

  return (
    <div>
      <PageHeader
        title={freight.code}
        description={`${freight.origin_city} → ${freight.destination_city}`}
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
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico do frete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(events ?? []).map((e) => (
                <div key={e.id} className="border-l-2 border-primary pl-4">
                  <p className="font-medium">{e.title}</p>
                  {e.description && (
                    <p className="text-sm text-muted-foreground">{e.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{formatDateTimeBR(e.created_at)}</p>
                </div>
              ))}
              <Link href={`/dashboard/rastreamento?freight=${id}`} className="text-sm text-primary hover:underline">
                Ver no rastreamento →
              </Link>
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
                Vinculada ao frete {freight.code} (freight_id). Aparece aqui e em Rastreamento.
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
        <TabsContent value="checklist" className="mt-4">
          <DeliveryChecklist freightId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
