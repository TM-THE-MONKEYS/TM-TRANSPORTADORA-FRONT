import type { FuelRefill } from "@/lib/api/services/fuel"

/** Normaliza resposta da API (UUID → string, campos opcionais). */
export function mapFuelRefillFromApi(raw: Record<string, unknown>): FuelRefill {
  const posto = (raw.posto as string | null | undefined) ?? null
  const observacoes = (raw.observacoes as string | null | undefined) ?? null

  return {
    id: String(raw.id),
    freight_id: String(raw.freight_id),
    driver_id: raw.driver_id != null ? String(raw.driver_id) : null,
    driver_name:
      (raw.driver_name as string | null | undefined) ??
      (raw.driver_nome as string | null | undefined) ??
      null,
    truck_id: raw.truck_id != null ? String(raw.truck_id) : null,
    litros: Number(raw.litros ?? 0),
    valor_total: Number(raw.valor_total ?? 0),
    valor_litro: raw.valor_litro != null ? Number(raw.valor_litro) : null,
    km_atual: raw.km_atual != null ? Number(raw.km_atual) : null,
    posto: posto ?? observacoes,
    cidade: (raw.cidade as string | null) ?? null,
    estado: (raw.estado as string | null) ?? null,
    freight_cost_id: raw.freight_cost_id != null ? String(raw.freight_cost_id) : null,
    freight_code: (raw.freight_code as string | null) ?? undefined,
    created_at: String(raw.created_at ?? raw.data_abastecimento ?? new Date().toISOString()),
  }
}

export function mapFuelRefillPageFromApi(
  data: { items?: unknown[] } | unknown[],
): FuelRefill[] {
  const items = Array.isArray(data) ? data : (data.items ?? [])
  return items.map((item) => mapFuelRefillFromApi(item as Record<string, unknown>))
}
