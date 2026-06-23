import type { ImplementType, TruckImplement } from "@/types"

export type TruckImplementInput = Omit<TruckImplement, "id" | "truck_id" | "tenant_id" | "created_at">

function positiveOrNull(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null
  return value
}

export function toImplementCreatePayload(
  data: TruckImplementInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: data.name.trim(),
    type: data.type as ImplementType,
  }
  if (data.plate?.trim()) payload.plate = data.plate.trim().toUpperCase()
  if (data.identifier?.trim()) payload.identifier = data.identifier.trim()
  if (data.brand?.trim()) payload.brand = data.brand.trim()
  if (data.model?.trim()) payload.model = data.model.trim()
  const cap = positiveOrNull(data.capacity_kg ?? undefined)
  if (cap != null) payload.capacity_kg = cap
  return payload
}

export function toImplementUpdatePayload(
  data: Partial<TruckImplementInput>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (data.name !== undefined) payload.name = data.name.trim()
  if (data.type !== undefined) payload.type = data.type
  if (data.plate !== undefined) payload.plate = data.plate?.trim().toUpperCase() || null
  if (data.identifier !== undefined) payload.identifier = data.identifier?.trim() || null
  if (data.brand !== undefined) payload.brand = data.brand?.trim() || null
  if (data.model !== undefined) payload.model = data.model?.trim() || null
  if (data.capacity_kg !== undefined) {
    payload.capacity_kg = positiveOrNull(data.capacity_kg ?? undefined)
  }
  return payload
}
