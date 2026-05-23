import type { Truck, TruckStatus } from "@/types"

export function toTruckCreatePayload(
  data: Omit<Truck, "id" | "created_at" | "tenant_id">,
): Record<string, unknown> {
  return {
    placa: data.plate,
    marca: data.brand,
    modelo: data.model,
    ano: data.year,
    capacidade_kg: data.capacity_kg ?? 0,
    consumo_km_l: data.avg_consumption_km_l ?? null,
    km_atual: data.mileage_km,
    status: data.status as TruckStatus,
    renavam: data.renavam ?? null,
    chassi: null,
    cor: null,
    observacoes: null,
  }
}

export function toTruckUpdatePayload(data: Partial<Truck>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (data.brand !== undefined) payload.marca = data.brand
  if (data.model !== undefined) payload.modelo = data.model
  if (data.capacity_kg !== undefined) payload.capacidade_kg = data.capacity_kg
  if (data.avg_consumption_km_l !== undefined) payload.consumo_km_l = data.avg_consumption_km_l
  if (data.mileage_km !== undefined) payload.km_atual = data.mileage_km
  if (data.status !== undefined) payload.status = data.status
  return payload
}
