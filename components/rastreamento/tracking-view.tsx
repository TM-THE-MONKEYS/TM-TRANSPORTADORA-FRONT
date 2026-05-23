"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { AlertTriangle } from "lucide-react"
import { getTrackingTimeline } from "@/lib/api/services/tracking"
import { getFreightOccurrences, listFreights } from "@/lib/api/services/freight"
import {
  isOccurrenceTrackingUpdate,
  trackingUpdatesWithoutOccurrences,
} from "@/lib/freight/occurrences"
import { ActiveTripLink } from "@/components/shared/active-trip-link"
import { findActiveFreightByDriver, findActiveFreightByTruck } from "@/lib/freight/active-trip"
import { useOperationContext } from "@/hooks/use-operation-context"

const TRACKING_STATUS_LABELS: Record<string, string> = {
  coletado: "Coletado",
  em_transito: "Em Trânsito",
  saiu_para_entrega: "Saiu p/ Entrega",
  tentativa_entrega: "Tentativa de Entrega",
  entregue: "Entregue",
  devolvido: "Devolvido",
}

const TRACKING_STATUS_COLORS: Record<string, string> = {
  coletado: "bg-blue-100 text-blue-700",
  em_transito: "bg-orange-100 text-orange-700",
  saiu_para_entrega: "bg-purple-100 text-purple-700",
  tentativa_entrega: "bg-yellow-100 text-yellow-700",
  entregue: "bg-green-100 text-green-700",
  devolvido: "bg-red-100 text-red-700",
}

const FREIGHT_STATUS_LABELS: Record<string, string> = {
  orcamento: "Orçamento",
  confirmado: "Confirmado",
  em_coleta: "Em Coleta",
  em_transporte: "Em Transporte",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

const OCCURRENCE_TYPE_LABELS: Record<string, string> = {
  atraso: "Atraso",
  avaria: "Avaria",
  documentacao: "Documentação",
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function TrackingView() {
  const [selectedFreightId, setSelectedFreightId] = useState<string>("")
  const { freights, drivers, trucks } = useOperationContext()

  const { data: timeline, isLoading: loadingTimeline } = useSWR(
    selectedFreightId ? ["tracking-timeline", selectedFreightId] : null,
    () => getTrackingTimeline(selectedFreightId),
  )

  const { data: occurrences, isLoading: loadingOcc } = useSWR(
    selectedFreightId ? ["freight-occ", selectedFreightId] : null,
    () => getFreightOccurrences(selectedFreightId),
  )

  const updates = trackingUpdatesWithoutOccurrences(timeline?.updates ?? [])
  const selectedFreight = freights.find((f) => f.id === selectedFreightId)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Rastreamento</h1>
        <p className="text-muted-foreground text-sm">
          Timeline e ocorrências por ordem de frete (freight_id)
        </p>
      </div>

      <div className="bg-card rounded-lg border p-4">
        <label className="mb-2 block text-sm font-medium">Ordem de frete</label>
        <select
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={selectedFreightId}
          onChange={(e) => setSelectedFreightId(e.target.value)}
        >
          <option value="">— Selecione um frete —</option>
          {freights.map((f) => (
            <option key={f.id} value={f.id}>
              {f.code} • {f.origin_city}/{f.origin_state} → {f.destination_city}/{f.destination_state}{" "}
              • {FREIGHT_STATUS_LABELS[f.status] ?? f.status}
            </option>
          ))}
        </select>
        {selectedFreight && (
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            {selectedFreight.driver_id && (
              <p>
                Motorista:{" "}
                <span className="text-foreground">
                  {drivers.find((d) => d.id === selectedFreight.driver_id)?.name ?? "—"}
                </span>
              </p>
            )}
            {selectedFreight.truck_id && (
              <p>
                Veículo:{" "}
                <span className="text-foreground">
                  {trucks.find((t) => t.id === selectedFreight.truck_id)?.plate ?? "—"}
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      {selectedFreightId && (
        <>
          <div className="bg-card rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">Linha do tempo</h2>
            {loadingTimeline ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : updates.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Nenhuma atualização de rastreamento.
              </p>
            ) : (
              <ol className="relative border-l border-border pl-6">
                {[...updates].reverse().map((update) => (
                  <li key={update.id} className="mb-6">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TRACKING_STATUS_COLORS[update.status] ?? "bg-muted"}`}
                    >
                      {TRACKING_STATUS_LABELS[update.status] ?? update.status}
                    </span>
                    <time className="ml-2 text-xs text-muted-foreground">
                      {formatDateTime(update.evento_at)}
                    </time>
                    {update.observacao && !isOccurrenceTrackingUpdate(update) && (
                      <p className="mt-1 text-sm">{update.observacao}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Ocorrências
            </h2>
            {loadingOcc ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : (occurrences ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhuma ocorrência. Registre em{" "}
                <Link href={`/dashboard/fretes/${selectedFreightId}`} className="text-primary underline">
                  detalhes do frete
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-3">
                {(occurrences ?? []).map((o) => (
                  <li key={o.id} className="rounded-md border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      {OCCURRENCE_TYPE_LABELS[o.type] ?? o.type}
                    </p>
                    <p className="text-sm">{o.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(o.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Fretes em percurso</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {freights
            .filter((f) => ["em_coleta", "em_transporte"].includes(f.status))
            .map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFreightId(f.id)}
                className={`bg-card rounded-lg border p-4 text-left transition-colors hover:border-primary/50 ${selectedFreightId === f.id ? "border-primary ring-1 ring-primary" : ""}`}
              >
                <p className="font-semibold">{f.code}</p>
                <p className="text-muted-foreground text-sm">
                  {f.origin_city}/{f.origin_state} → {f.destination_city}/{f.destination_state}
                </p>
                <span className="mt-2 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                  {FREIGHT_STATUS_LABELS[f.status] ?? f.status}
                </span>
                {f.driver_id && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Motorista: {drivers.find((d) => d.id === f.driver_id)?.name}
                  </p>
                )}
                {f.truck_id && (
                  <p className="text-xs text-muted-foreground">
                    Veículo: {trucks.find((t) => t.id === f.truck_id)?.plate}
                  </p>
                )}
              </button>
            ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-medium">Motoristas em viagem</h3>
          {drivers.map((d) => {
            const trip = findActiveFreightByDriver(freights, d.id)
            if (!trip) return null
            return (
              <div key={d.id} className="mb-2">
                <p className="text-sm font-medium">{d.name}</p>
                <ActiveTripLink freight={trip} />
              </div>
            )
          })}
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-medium">Veículos em viagem</h3>
          {trucks.map((t) => {
            const trip = findActiveFreightByTruck(freights, t.id)
            if (!trip) return null
            return (
              <div key={t.id} className="mb-2">
                <p className="text-sm font-medium">
                  {t.plate} — {t.model}
                </p>
                <ActiveTripLink freight={trip} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
