import {
  mapMaintenanceFromApi,
  mapMaintenancePageFromApi,
  toMaintenanceCreatePayload,
  toMaintenanceUpdatePayload,
} from "@/lib/api/adapters/maintenance"
import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import { revalidateMaintenanceCaches } from "@/lib/maintenance/cache"
import { syncTruckForMaintenanceStatus } from "@/lib/maintenance/sync-truck-status"
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

async function afterMaintenanceMutation(
  maintenance: Maintenance,
  previousStatus?: MaintenanceStatus,
): Promise<Maintenance> {
  await syncTruckForMaintenanceStatus(
    maintenance.truck_id,
    maintenance.status,
    previousStatus,
  )
  revalidateMaintenanceCaches()
  return maintenance
}

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

  const res = await apiRequest<Paginated<Record<string, unknown>>>(`/maintenance?${qs}`, {
    auth: true,
  })
  return {
    ...res,
    items: mapMaintenancePageFromApi(res),
    page_size: res.page_size ?? pageSize,
  }
}

export async function getMaintenanceAlerts(daysAhead = 30): Promise<Maintenance[]> {
  if (shouldUseMocks()) {
    return mockMaintenances.filter((m) => m.status === "agendada")
  }

  const raw = await apiRequest<Record<string, unknown>[]>(
    `/maintenance/alerts?days_ahead=${daysAhead}`,
    { auth: true },
  )
  if (!Array.isArray(raw)) return []
  return raw.map((item) => mapMaintenanceFromApi(item))
}

export async function getMaintenance(id: string): Promise<Maintenance> {
  if (shouldUseMocks()) {
    const m = mockMaintenances.find((item) => item.id === id)
    if (!m) throw new Error("Manutenção não encontrada")
    return m
  }

  const raw = await apiRequest<Record<string, unknown>>(`/maintenance/${id}`, { auth: true })
  return mapMaintenanceFromApi(raw)
}

export async function createMaintenance(
  data: Omit<Maintenance, "id" | "created_at" | "updated_at">,
): Promise<Maintenance> {
  const status = data.status ?? "agendada"

  if (shouldUseMocks()) {
    const created: Maintenance = {
      ...data,
      status,
      id: `maint-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockMaintenances.unshift(created)
    return afterMaintenanceMutation(created)
  }

  const raw = await apiRequest<Record<string, unknown>>("/maintenance", {
    method: "POST",
    body: toMaintenanceCreatePayload({ ...data, status }),
    auth: true,
  })
  const created = mapMaintenanceFromApi(raw)
  return afterMaintenanceMutation(created)
}

export async function updateMaintenance(
  id: string,
  data: Partial<Maintenance>,
): Promise<Maintenance> {
  if (shouldUseMocks()) {
    const idx = mockMaintenances.findIndex((m) => m.id === id)
    if (idx < 0) throw new Error("Manutenção não encontrada")
    const previousStatus = mockMaintenances[idx].status
    mockMaintenances[idx] = {
      ...mockMaintenances[idx],
      ...data,
      updated_at: new Date().toISOString(),
    }
    return afterMaintenanceMutation(mockMaintenances[idx], previousStatus)
  }

  const existing = await getMaintenance(id)
  const raw = await apiRequest<Record<string, unknown>>(`/maintenance/${id}`, {
    method: "PATCH",
    body: toMaintenanceUpdatePayload(data),
    auth: true,
  })
  const updated = mapMaintenanceFromApi(raw)
  return afterMaintenanceMutation(updated, existing.status)
}

export async function advanceMaintenanceStatus(
  id: string,
  nextStatus: MaintenanceStatus,
): Promise<Maintenance> {
  const patch: Partial<Maintenance> = { status: nextStatus }
  const today = new Date().toISOString().slice(0, 10)

  if (nextStatus === "em_andamento") {
    patch.data_inicio = today
  }
  if (nextStatus === "concluida") {
    patch.data_conclusao = today
  }

  return updateMaintenance(id, patch)
}

export async function deleteMaintenance(id: string): Promise<void> {
  if (shouldUseMocks()) {
    const idx = mockMaintenances.findIndex((m) => m.id === id)
    if (idx < 0) throw new Error("Manutenção não encontrada")
    const removed = mockMaintenances[idx]
    mockMaintenances.splice(idx, 1)
    if (removed.status === "em_andamento") {
      await syncTruckForMaintenanceStatus(removed.truck_id, "concluida", "em_andamento")
    }
    revalidateMaintenanceCaches()
    return
  }

  const existing = await getMaintenance(id)
  await apiRequest(`/maintenance/${id}`, { method: "DELETE", auth: true })
  if (existing.status === "em_andamento") {
    await syncTruckForMaintenanceStatus(existing.truck_id, "concluida", "em_andamento")
  }
  revalidateMaintenanceCaches()
}
