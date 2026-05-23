import type { FreightOrder } from "@/types"
import type { TrackingUpdate } from "@/types"
import type { FreightEvent } from "@/types"

export function toFreightCreatePayload(
  data: Omit<FreightOrder, "id" | "code" | "created_at" | "updated_at" | "tenant_id">,
): Record<string, unknown> {
  return {
    client_id: data.customer_id,
    driver_id: data.driver_id ?? null,
    truck_id: data.truck_id ?? null,
    origem: {
      logradouro: data.origin_city,
      cidade: data.origin_city,
      estado: data.origin_state,
    },
    destino: {
      logradouro: data.destination_city,
      cidade: data.destination_city,
      estado: data.destination_state,
    },
    valor_frete: Number(data.value_brl),
    status: data.status ?? "orcamento",
    data_entrega_prevista: data.deadline_at ?? null,
    observacoes: data.cargo_description,
    costs: [],
  }
}

export function toFreightUpdatePayload(data: Partial<FreightOrder>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (data.driver_id !== undefined) payload.driver_id = data.driver_id
  if (data.truck_id !== undefined) payload.truck_id = data.truck_id
  if (data.value_brl !== undefined) payload.valor_frete = data.value_brl
  if (data.status !== undefined) payload.status = data.status
  if (data.deadline_at !== undefined) payload.data_entrega_prevista = data.deadline_at
  if (data.cargo_description !== undefined) payload.observacoes = data.cargo_description
  return payload
}

export function mapTrackingUpdateToFreightEvent(update: TrackingUpdate): FreightEvent {
  return {
    id: update.id,
    freight_id: update.freight_id,
    status: "em_transporte",
    title: update.observacao ?? update.status,
    description: update.latitude
      ? `Lat ${update.latitude}, Lng ${update.longitude ?? "—"}`
      : undefined,
    created_at: update.evento_at ?? update.created_at,
  }
}
