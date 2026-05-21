import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import type { Maintenance, MaintenanceStatus, MaintenanceType, Paginated } from "@/types"

// ── Mock data ────────────────────────────────────────────────────────────────

const mockMaintenances: Maintenance[] = [
  {
    id: "maint-1",
    truck_id: "truck-2",
    tipo: "corretiva",
    status: "em_andamento",
    descricao: "Troca de pneus dianteiros",
    custo: 4500,
    oficina: "Oficina Central",
    data_agendada: "2026-05-18",
    data_inicio: "2026-05-18",
    km_na_manutencao: 240000,
    proxima_manutencao_km: 260000,
    created_at: "2026-05-17T10:00:00Z",
    updated_at: "2026-05-18T08:00:00Z",
  },
  {
    id: "maint-2",
    truck_id: "truck-1",
    tipo: "preventiva",
    status: "agendada",
    descricao: "Revisão 200.000 km",
    custo: 2800,
    oficina: "Concessionária Volvo",
    data_agendada: "2026-06-10",
    km_na_manutencao: 185000,
    proxima_manutencao_km: 200000,
    proxima_manutencao_data: "2026-06-10",
    created_at: "2026-05-15T10:00:00Z",
    updated_at: "2026-05-15T10:00:00Z",
  },
]

// ── Service functions ─────────────────────────────────────────────────────────

export async function listMaintenances(
  page = 1,
  pageSize = 20,
  truckId?: string,
  status?: MaintenanceStatus,
  tipo?: MaintenanceType,
): Promise<Paginated<Maintenance>> {
  if (shouldUseMocks()) {
    let items = [...mockMaintenances]
    if (truckId) items = items.filter((m) => m.truck_id === truckId)
    if (status) items = items.filter((m) => m.status === status)
    if (tipo) items = items.filter((m) => m.tipo === tipo)
    const start = (page - 1) * pageSize
    return {
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      page_size: pageSize,
      pages: Math.max(1, Math.ceil(items.length / pageSize)),
    }
  }
  const qs = new URLSearchParams({ page: String(page), size: String(pageSize) })
  if (truckId) qs.set("truck_id", truckId)
  if (status) qs.set("status", status)
  if (tipo) qs.set("tipo", tipo)
  return apiRequest(`/maintenance?${qs}`, { auth: true })
}

export async function getMaintenanceAlerts(daysAhead = 30): Promise<Maintenance[]> {
  if (shouldUseMocks()) {
    return mockMaintenances.filter((m) => m.status === "agendada")
  }
  return apiRequest(`/maintenance/alerts?days_ahead=${daysAhead}`, { auth: true })
}

export async function getMaintenance(id: string): Promise<Maintenance> {
  if (shouldUseMocks()) {
    const m = mockMaintenances.find((m) => m.id === id)
    if (!m) throw new Error("Manutenção não encontrada")
    return m
  }
  return apiRequest(`/maintenance/${id}`, { auth: true })
}

export async function createMaintenance(
  data: Omit<Maintenance, "id" | "created_at" | "updated_at">,
): Promise<Maintenance> {
  if (shouldUseMocks()) {
    const m: Maintenance = {
      ...data,
      id: `maint-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockMaintenances.unshift(m)
    return m
  }
  return apiRequest("/maintenance", { method: "POST", body: data, auth: true })
}

export async function updateMaintenance(id: string, data: Partial<Maintenance>): Promise<Maintenance> {
  if (shouldUseMocks()) {
    const idx = mockMaintenances.findIndex((m) => m.id === id)
    if (idx < 0) throw new Error("Manutenção não encontrada")
    mockMaintenances[idx] = { ...mockMaintenances[idx], ...data, updated_at: new Date().toISOString() }
    return mockMaintenances[idx]
  }
  return apiRequest(`/maintenance/${id}`, { method: "PATCH", body: data, auth: true })
}
