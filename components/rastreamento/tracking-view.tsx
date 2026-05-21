"use client"

import { useState } from "react"
import useSWR from "swr"
import { getTrackingTimeline } from "@/lib/api/services/tracking"
import { listFreights } from "@/lib/api/services/freight"

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

  const { data: freightsPage, isLoading: loadingFreights } = useSWR(
    "tracking-freights-list",
    () => listFreights(1, 100),
  )

  const { data: timeline, isLoading: loadingTimeline } = useSWR(
    selectedFreightId ? ["tracking-timeline", selectedFreightId] : null,
    () => getTrackingTimeline(selectedFreightId),
  )

  const freights = freightsPage?.items ?? []
  const updates = timeline?.updates ?? []

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Rastreamento</h1>
        <p className="text-muted-foreground text-sm">Acompanhe a linha do tempo das entregas</p>
      </div>

      {/* Freight selector */}
      <div className="bg-card rounded-lg border p-4">
        <label className="mb-2 block text-sm font-medium">Selecionar Frete</label>
        <select
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={selectedFreightId}
          onChange={(e) => setSelectedFreightId(e.target.value)}
          disabled={loadingFreights}
        >
          <option value="">— Selecione um frete —</option>
          {freights.map((f) => (
            <option key={f.id} value={f.id}>
              {f.code} • {f.origin_city}/{f.origin_state} → {f.destination_city}/
              {f.destination_state} •{" "}
              {FREIGHT_STATUS_LABELS[f.status] ?? f.status}
            </option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      {selectedFreightId && (
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Linha do Tempo</h2>

          {loadingTimeline ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="bg-muted h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="bg-muted h-4 w-32 rounded" />
                    <div className="bg-muted h-3 w-48 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : updates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma atualização de rastreamento registrada para este frete.
            </p>
          ) : (
            <ol className="relative border-l border-gray-200">
              {[...updates].reverse().map((update, idx) => (
                <li key={update.id} className="mb-6 ml-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white bg-blue-500">
                    <svg
                      className="h-3 w-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TRACKING_STATUS_COLORS[update.status] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {TRACKING_STATUS_LABELS[update.status] ?? update.status}
                    </span>
                    <time className="text-muted-foreground text-xs">
                      {formatDateTime(update.evento_at)}
                    </time>
                  </div>
                  {update.observacao && (
                    <p className="mt-1 text-sm text-gray-600">{update.observacao}</p>
                  )}
                  {update.latitude && update.longitude && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      📍 {update.latitude.toFixed(4)}, {update.longitude.toFixed(4)}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Active freights summary */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Fretes Ativos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {freights
            .filter((f) => ["em_coleta", "em_transporte"].includes(f.status))
            .slice(0, 6)
            .map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFreightId(f.id)}
                className={`bg-card rounded-lg border p-4 text-left transition-colors hover:border-blue-400 ${selectedFreightId === f.id ? "border-blue-500 ring-1 ring-blue-500" : ""}`}
              >
                <p className="font-semibold">{f.code}</p>
                <p className="text-muted-foreground text-sm">
                  {f.origin_city}/{f.origin_state} → {f.destination_city}/{f.destination_state}
                </p>
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${f.status === "em_transporte" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"}`}
                >
                  {FREIGHT_STATUS_LABELS[f.status] ?? f.status}
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
