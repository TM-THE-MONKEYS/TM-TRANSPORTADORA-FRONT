import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import * as mock from "@/lib/mocks/handlers"
import type { Driver, Paginated } from "@/types"

export async function listDrivers(page = 1, pageSize = 20): Promise<Paginated<Driver>> {
  if (shouldUseMocks()) return mock.mockListDrivers(page, pageSize)
  return apiRequest(`/drivers?page=${page}&size=${pageSize}`, { auth: true })
}

export async function getDriver(id: string): Promise<Driver> {
  if (shouldUseMocks()) {
    const d = await mock.mockGetDriver(id)
    if (!d) throw new Error("Motorista não encontrado")
    return d
  }
  return apiRequest(`/drivers/${id}`, { auth: true })
}

export async function createDriver(
  data: Omit<Driver, "id" | "created_at" | "tenant_id">,
): Promise<Driver> {
  if (shouldUseMocks()) return mock.mockCreateDriver(data)
  return apiRequest("/drivers", { method: "POST", body: data, auth: true })
}

export async function updateDriver(id: string, data: Partial<Driver>): Promise<Driver> {
  if (shouldUseMocks()) return mock.mockUpdateDriver(id, data)
  return apiRequest(`/drivers/${id}`, { method: "PATCH", body: data, auth: true })
}
