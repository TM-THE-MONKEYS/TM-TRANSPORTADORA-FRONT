import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import * as mock from "@/lib/mocks/handlers"
import type { Paginated, Truck, TruckImplement } from "@/types"

export async function listTrucks(page = 1, pageSize = 20): Promise<Paginated<Truck>> {
  if (shouldUseMocks()) return mock.mockListTrucks(page, pageSize)
  return apiRequest(`/fleet/trucks?page=${page}&page_size=${pageSize}`, { auth: true })
}

export async function getTruck(id: string): Promise<Truck> {
  if (shouldUseMocks()) {
    const t = await mock.mockGetTruck(id)
    if (!t) throw new Error("Caminhão não encontrado")
    return t
  }
  return apiRequest(`/fleet/trucks/${id}`, { auth: true })
}

export async function createTruck(
  data: Omit<Truck, "id" | "created_at" | "tenant_id">,
): Promise<Truck> {
  if (shouldUseMocks()) return mock.mockCreateTruck(data)
  return apiRequest("/fleet/trucks", { method: "POST", body: data, auth: true })
}

export async function updateTruck(id: string, data: Partial<Truck>): Promise<Truck> {
  if (shouldUseMocks()) return mock.mockUpdateTruck(id, data)
  return apiRequest(`/fleet/trucks/${id}`, { method: "PATCH", body: data, auth: true })
}

export async function listImplements(truckId: string): Promise<TruckImplement[]> {
  if (shouldUseMocks()) return mock.mockListImplements(truckId)
  return apiRequest(`/fleet/trucks/${truckId}/implements`, { auth: true })
}
