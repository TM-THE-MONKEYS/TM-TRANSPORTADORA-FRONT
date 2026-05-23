import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
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

/** Implementos: apenas mock — backend v1 não expõe endpoint. */
export async function listImplements(truckId: string): Promise<TruckImplement[]> {
  if (shouldUseMocks()) return mock.mockListImplements(truckId)
  return []
}
