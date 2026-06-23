import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import {
  toImplementCreatePayload,
  toImplementUpdatePayload,
} from "@/lib/api/adapters/implements"
import {
  toTruckCreatePayload,
  toTruckUpdatePayload,
} from "@/lib/api/adapters/trucks"
import * as mock from "@/lib/mocks/handlers"
import type { Paginated, Truck, TruckImplement } from "@/types"

export async function listTrucks(
  page = 1,
  pageSize = 20,
  search?: string,
): Promise<Paginated<Truck>> {
  if (shouldUseMocks()) return mock.mockListTrucks(page, pageSize, search)
  const qs = new URLSearchParams({ page: String(page), size: String(pageSize) })
  if (search?.trim()) qs.set("search", search.trim())
  return apiRequest(`/trucks?${qs}`, { auth: true })
}

export async function getTruck(id: string): Promise<Truck> {
  if (shouldUseMocks()) {
    const t = await mock.mockGetTruck(id)
    if (!t) throw new Error("Caminhão não encontrado")
    return t
  }
  return apiRequest(`/trucks/${id}`, { auth: true })
}

export async function createTruck(
  data: Omit<Truck, "id" | "created_at" | "tenant_id">,
): Promise<Truck> {
  if (shouldUseMocks()) return mock.mockCreateTruck(data)
  return apiRequest("/trucks", {
    method: "POST",
    body: toTruckCreatePayload(data),
    auth: true,
  })
}

export async function updateTruck(id: string, data: Partial<Truck>): Promise<Truck> {
  if (shouldUseMocks()) return mock.mockUpdateTruck(id, data)
  return apiRequest(`/trucks/${id}`, {
    method: "PATCH",
    body: toTruckUpdatePayload(data),
    auth: true,
  })
}

export async function deleteTruck(id: string): Promise<void> {
  if (shouldUseMocks()) return mock.mockDeleteTruck(id)
  await apiRequest(`/trucks/${id}`, { method: "DELETE", auth: true })
}

/** Implementos vinculados ao caminhão (carreta, baú, etc.). */
export async function listImplements(truckId: string): Promise<TruckImplement[]> {
  if (shouldUseMocks()) return mock.mockListImplements(truckId)
  return apiRequest(`/trucks/${truckId}/implements`, { auth: true })
}

export async function createImplement(
  truckId: string,
  data: Omit<TruckImplement, "id" | "truck_id" | "tenant_id" | "created_at">,
): Promise<TruckImplement> {
  if (shouldUseMocks()) return mock.mockCreateImplement(truckId, data)
  return apiRequest(`/trucks/${truckId}/implements`, {
    method: "POST",
    body: toImplementCreatePayload(data),
    auth: true,
  })
}

export async function updateImplement(
  truckId: string,
  implementId: string,
  data: Partial<Omit<TruckImplement, "id" | "truck_id" | "tenant_id" | "created_at">>,
): Promise<TruckImplement> {
  if (shouldUseMocks()) return mock.mockUpdateImplement(truckId, implementId, data)
  return apiRequest(`/trucks/${truckId}/implements/${implementId}`, {
    method: "PATCH",
    body: toImplementUpdatePayload(data),
    auth: true,
  })
}

export async function deleteImplement(truckId: string, implementId: string): Promise<void> {
  if (shouldUseMocks()) return mock.mockDeleteImplement(truckId, implementId)
  await apiRequest(`/trucks/${truckId}/implements/${implementId}`, {
    method: "DELETE",
    auth: true,
  })
}
