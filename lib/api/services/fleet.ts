import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import * as mock from "@/lib/mocks/handlers"
import type { Paginated, Truck } from "@/types"

export async function listTrucks(page = 1, pageSize = 20): Promise<Paginated<Truck>> {
  if (shouldUseMocks()) return mock.mockListTrucks(page, pageSize)
  return apiRequest(`/trucks?page=${page}&size=${pageSize}`, { auth: true })
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
  // Map frontend fields to backend Portuguese field names
  const payload = {
    placa: data.plate,
    marca: data.brand,
    modelo: data.model,
    ano: data.year,
    capacidade_kg: data.capacity_kg ?? 0,
    consumo_km_l: data.avg_consumption_km_l,
    km_atual: data.mileage_km,
    status: data.status,
    renavam: data.renavam,
  }
  return apiRequest("/trucks", { method: "POST", body: payload, auth: true })
}

export async function updateTruck(id: string, data: Partial<Truck>): Promise<Truck> {
  if (shouldUseMocks()) return mock.mockUpdateTruck(id, data)
  const payload: Record<string, unknown> = {}
  if (data.brand !== undefined) payload.marca = data.brand
  if (data.model !== undefined) payload.modelo = data.model
  if (data.capacity_kg !== undefined) payload.capacidade_kg = data.capacity_kg
  if (data.avg_consumption_km_l !== undefined) payload.consumo_km_l = data.avg_consumption_km_l
  if (data.mileage_km !== undefined) payload.km_atual = data.mileage_km
  if (data.status !== undefined) payload.status = data.status
  return apiRequest(`/trucks/${id}`, { method: "PATCH", body: payload, auth: true })
}
