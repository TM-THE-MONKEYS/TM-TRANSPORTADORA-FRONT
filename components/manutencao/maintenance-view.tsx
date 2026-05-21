"use client"

import useSWR from "swr"
import { getMaintenanceAlerts, listMaintenances } from "@/lib/api/services/maintenance"

const STATUS_LABELS: Record<string, string> = {
  agendada: "Agendada",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
}

const STATUS_COLORS: Record<string, string> = {
  agendada: "bg-blue-100 text-blue-700",
  em_andamento: "bg-yellow-100 text-yellow-700",
  concluida: "bg-green-100 text-green-700",
  cancelada: "bg-gray-100 text-gray-500",
}

const TYPE_LABELS: Record<string, string> = {
  preventiva: "Preventiva",
  corretiva: "Corretiva",
}

const TYPE_COLORS: Record<string, string> = {
  preventiva: "bg-purple-100 text-purple-700",
  corretiva: "bg-orange-100 text-orange-700",
}

function formatBRL(value?: number) {
  if (value === undefined || value === null) return "—"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("pt-BR")
}

export function MaintenanceView() {
  const { data: alertsData, isLoading: loadingAlerts } = useSWR(
    "maintenance-alerts",
    () => getMaintenanceAlerts(30),
  )

  const { data: maintenancePage, isLoading: loadingList } = useSWR(
    "maintenance-list",
    () => listMaintenances(1, 50),
  )

  const alerts = alertsData ?? []
  const items = maintenancePage?.items ?? []

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Manutenção de Frota</h1>
        <p className="text-muted-foreground text-sm">Histórico e alertas de manutenção</p>
      </div>

      {/* Alerts Banner */}
      {!loadingAlerts && alerts.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h2 className="mb-2 font-semibold text-yellow-800">
            ⚠ {alerts.length} manutenção(ões) agendada(s) nos próximos 30 dias
          </h2>
          <ul className="space-y-1 text-sm text-yellow-700">
            {alerts.map((alert) => (
              <li key={alert.id}>
                Caminhão {alert.truck_id.slice(0, 8)} — {TYPE_LABELS[alert.tipo] ?? alert.tipo}
                {alert.data_agendada ? ` em ${formatDate(alert.data_agendada)}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(["agendada", "em_andamento", "concluida", "cancelada"] as const).map((s) => {
          const count = items.filter((i) => i.status === s).length
          return (
            <div key={s} className="bg-card rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">{STATUS_LABELS[s]}</p>
              <p className="mt-1 text-3xl font-bold">{loadingList ? "—" : count}</p>
            </div>
          )
        })}
      </div>

      {/* Maintenance Table */}
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Tipo</th>
              <th className="px-4 py-3 text-left font-medium">Descrição</th>
              <th className="px-4 py-3 text-left font-medium">Oficina</th>
              <th className="px-4 py-3 text-left font-medium">Agendado</th>
              <th className="px-4 py-3 text-right font-medium">Custo</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loadingList ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="bg-muted h-4 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">
                  Nenhuma manutenção registrada
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${TYPE_COLORS[item.tipo] ?? ""}`}
                    >
                      {TYPE_LABELS[item.tipo] ?? item.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3">{item.descricao ?? "—"}</td>
                  <td className="text-muted-foreground px-4 py-3">{item.oficina ?? "—"}</td>
                  <td className="px-4 py-3">{formatDate(item.data_agendada)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatBRL(item.custo)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[item.status] ?? ""}`}
                    >
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
