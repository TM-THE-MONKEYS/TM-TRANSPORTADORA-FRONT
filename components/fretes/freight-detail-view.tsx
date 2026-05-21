"use client"

import useSWR from "swr"
import { toast } from "sonner"
import { ArrowRight, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { FreightStatusBadge } from "@/components/fretes/freight-status-badge"
import { DeliveryChecklist } from "@/components/fretes/delivery-checklist"
import {
  addOccurrence,
  advanceFreightStatus,
  getFreight,
  getFreightEvents,
  getFreightOccurrences,
} from "@/lib/api/services/freight"
import { formatBRL } from "@/lib/format/currency"
import { formatDateTimeBR } from "@/lib/format/dates"
import { FREIGHT_STATUS_FLOW } from "@/lib/freight/status"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import { useState } from "react"

export function FreightDetailView({ id }: { id: string }) {
  const canStatus = usePermission(PERMISSIONS.freightStatus)
  const { data: freight, mutate } = useSWR(["freight", id], () => getFreight(id))
  const { data: events, mutate: mutateEvents } = useSWR(["freight-events", id], () =>
    getFreightEvents(id),
  )
  const { data: occurrences, mutate: mutateOcc } = useSWR(["freight-occ", id], () =>
    getFreightOccurrences(id),
  )
  const [occType, setOccType] = useState("atraso")
  const [occDesc, setOccDesc] = useState("")

  if (!freight) return <Skeleton className="h-96 w-full" />

  async function handleAdvance() {
    try {
      await advanceFreightStatus(id)
      toast.success("Status atualizado")
      mutate()
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
      mutateOcc()
      toast.success("Ocorrência registrada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro")
    }
  }

  const flowIdx = FREIGHT_STATUS_FLOW.indexOf(freight.status)

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
      </div>

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
