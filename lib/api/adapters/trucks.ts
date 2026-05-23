import type { Truck, TruckStatus } from "@/types"

function positiveOrNull(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null
  return value
}

export function toTruckCreatePayload(
  data: Omit<Truck, "id" | "created_at" | "tenant_id">,
): Record<string, unknown> {
  const capacidade = positiveOrNull(data.capacity_kg)
  const consumo = positiveOrNull(data.avg_consumption_km_l ?? undefined)
  const kmAtual = positiveOrNull(data.mileage_km)

  const payload: Record<string, unknown> = {
    placa: data.plate.trim().toUpperCase(),
    marca: data.brand.trim(),
    modelo: data.model.trim(),
    ano: data.year,
    status: data.status as TruckStatus,
    renavam: data.renavam?.trim() || null,
    chassi: null,
    cor: null,
    observacoes: null,
  }

  if (capacidade != null) payload.capacidade_kg = capacidade
  if (consumo != null) payload.consumo_km_l = consumo
  if (kmAtual != null) payload.km_atual = kmAtual

  return payload
}

export function toTruckUpdatePayload(data: Partial<Truck>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (data.brand !== undefined) payload.marca = data.brand
  if (data.model !== undefined) payload.modelo = data.model
  if (data.capacity_kg !== undefined) {
    const cap = positiveOrNull(data.capacity_kg)
    if (cap != null) payload.capacidade_kg = cap
  }
  if (data.avg_consumption_km_l !== undefined) {
    const cons = positiveOrNull(data.avg_consumption_km_l)
    if (cons != null) payload.consumo_km_l = cons
  }
  if (data.mileage_km !== undefined) {
    const km = positiveOrNull(data.mileage_km)
    if (km != null) payload.km_atual = km
  }
  if (data.status !== undefined) payload.status = data.status
  return payload
}
