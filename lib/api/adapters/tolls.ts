import type { TollCharge, EligibleFreightItem, TollChargeSummary } from "@/lib/api/services/tolls"

export function mapTollChargeFromApi(raw: Record<string, unknown>): TollCharge {
  return {
    id: String(raw.id),
    freight_id: String(raw.freight_id ?? raw.freightId),
    driver_id:
      raw.driver_id != null
        ? String(raw.driver_id)
        : raw.driverId != null
          ? String(raw.driverId)
          : null,
    registrado_por_user_id:
      raw.registrado_por_user_id != null
        ? String(raw.registrado_por_user_id)
        : raw.registradoPorUserId != null
          ? String(raw.registradoPorUserId)
          : null,
    freight_cost_id:
      raw.freight_cost_id != null
        ? String(raw.freight_cost_id)
        : raw.freightCostId != null
          ? String(raw.freightCostId)
          : null,
    valor: Number(raw.valor ?? 0),
    quantidade: Number(raw.quantidade ?? 1),
    praca: (raw.praca as string | null) ?? null,
    rodovia: (raw.rodovia as string | null) ?? null,
    cidade: (raw.cidade as string | null) ?? null,
    estado: (raw.estado as string | null) ?? null,
    observacoes: (raw.observacoes as string | null) ?? null,
    data_pedagio: String(
      raw.data_pedagio ?? raw.dataPedagio ?? raw.toll_at ?? new Date().toISOString(),
    ),
    created_at: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
    freight_code:
      (raw.freight_code as string | null) ??
      (raw.freightCode as string | null) ??
      undefined,
    driver_name:
      (raw.driver_name as string | null) ??
      (raw.driver_nome as string | null) ??
      (raw.driverName as string | null) ??
      undefined,
  }
}

export function mapTollChargePageFromApi(
  data: { items?: unknown[] } | unknown[],
): TollCharge[] {
  const items = Array.isArray(data) ? data : (data.items ?? [])
  return items.map((item) => mapTollChargeFromApi(item as Record<string, unknown>))
}

export function mapEligibleFreightFromApi(raw: Record<string, unknown>): EligibleFreightItem {
  return {
    freightId: String(raw.freightId ?? raw.freight_id),
    freightCode: String(raw.freightCode ?? raw.freight_code ?? ""),
    status: String(raw.status ?? ""),
    driverId: String(raw.driverId ?? raw.driver_id ?? ""),
    driverName: String(raw.driverName ?? raw.driver_name ?? ""),
    truckId: raw.truckId != null ? String(raw.truckId) : raw.truck_id != null ? String(raw.truck_id) : null,
    truckPlate:
      raw.truckPlate != null
        ? String(raw.truckPlate)
        : raw.truck_plate != null
          ? String(raw.truck_plate)
          : null,
    originCity: String(raw.originCity ?? raw.origin_city ?? ""),
    originState: String(raw.originState ?? raw.origin_state ?? ""),
    destinationCity: String(raw.destinationCity ?? raw.destination_city ?? ""),
    destinationState: String(raw.destinationState ?? raw.destination_state ?? ""),
  }
}

export function mapTollChargeSummaryFromApi(raw: Record<string, unknown>): TollChargeSummary {
  return {
    freightId: String(raw.freightId ?? raw.freight_id ?? ""),
    freightCode: (raw.freightCode as string | null) ?? (raw.freight_code as string | null) ?? null,
    status: String(raw.status ?? ""),
    driverId: raw.driverId != null ? String(raw.driverId) : raw.driver_id != null ? String(raw.driver_id) : null,
    driverName:
      (raw.driverName as string | null) ?? (raw.driver_name as string | null) ?? null,
    totalValor: Number(raw.totalValor ?? raw.total_valor ?? 0),
    totalQuantidade: Number(raw.totalQuantidade ?? raw.total_quantidade ?? 0),
    chargesCount: Number(raw.chargesCount ?? raw.charges_count ?? 0),
  }
}
