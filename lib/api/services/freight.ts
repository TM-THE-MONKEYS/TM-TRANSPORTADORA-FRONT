import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import * as mock from "@/lib/mocks/handlers"
import type {
  Customer,
  FreightEvent,
  FreightOccurrence,
  FreightOrder,
  FreightStatus,
  Paginated,
} from "@/types"

export async function listFreights(page = 1, pageSize = 20): Promise<Paginated<FreightOrder>> {
  if (shouldUseMocks()) return mock.mockListFreights(page, pageSize)
  return apiRequest(`/freights?page=${page}&size=${pageSize}`, { auth: true })
}

export async function getFreight(id: string): Promise<FreightOrder> {
  if (shouldUseMocks()) {
    const f = await mock.mockGetFreight(id)
    if (!f) throw new Error("Frete não encontrado")
    return f
  }
  return apiRequest(`/freights/${id}`, { auth: true })
}

export async function createFreight(
  data: Omit<FreightOrder, "id" | "code" | "created_at" | "updated_at" | "tenant_id">,
): Promise<FreightOrder> {
  if (shouldUseMocks()) return mock.mockCreateFreight(data)
  // Map frontend FreightOrder shape to backend FreightCreate schema
  const payload = {
    client_id: data.customer_id,
    driver_id: data.driver_id ?? null,
    truck_id: data.truck_id ?? null,
    origem: {
      cidade: data.origin_city,
      estado: data.origin_state,
      logradouro: data.origin_city,
    },
    destino: {
      cidade: data.destination_city,
      estado: data.destination_state,
      logradouro: data.destination_city,
    },
    valor_frete: data.value_brl,
    status: data.status ?? "orcamento",
    data_entrega_prevista: data.deadline_at ?? null,
    observacoes: data.cargo_description,
    costs: [],
  }
  return apiRequest("/freights", { method: "POST", body: payload, auth: true })
}

export async function updateFreight(id: string, data: Partial<FreightOrder>): Promise<FreightOrder> {
  if (shouldUseMocks()) return mock.mockUpdateFreight(id, data)
  const payload: Record<string, unknown> = {}
  if (data.driver_id !== undefined) payload.driver_id = data.driver_id
  if (data.truck_id !== undefined) payload.truck_id = data.truck_id
  if (data.value_brl !== undefined) payload.valor_frete = data.value_brl
  if (data.status !== undefined) payload.status = data.status
  if (data.deadline_at !== undefined) payload.data_entrega_prevista = data.deadline_at
  if (data.cargo_description !== undefined) payload.observacoes = data.cargo_description
  return apiRequest(`/freights/${id}`, { method: "PATCH", body: payload, auth: true })
}

export async function advanceFreightStatus(id: string): Promise<FreightOrder> {
  if (shouldUseMocks()) return mock.mockAdvanceFreightStatus(id)
  return apiRequest(`/freights/${id}/advance-status`, { method: "POST", auth: true })
}

export async function updateFreightStatus(id: string, status: FreightStatus): Promise<FreightOrder> {
  if (shouldUseMocks()) return mock.mockUpdateFreightStatus(id, status)
  return apiRequest(`/freights/${id}/status`, {
    method: "PATCH",
    body: { status },
    auth: true,
  })
}

export async function getFreightEvents(freightId: string): Promise<FreightEvent[]> {
  if (shouldUseMocks()) return mock.mockListFreightEvents(freightId)
  // Backend doesn't have a dedicated events endpoint; tracking updates serve this purpose
  return apiRequest<{ updates: FreightEvent[] }>(`/tracking/${freightId}/timeline`, { auth: true })
    .then((timeline) => timeline.updates ?? [])
    .catch(() => [])
}

export async function getFreightOccurrences(freightId: string): Promise<FreightOccurrence[]> {
  if (shouldUseMocks()) return mock.mockFreightOccurrences(freightId)
  return []
}

export async function addOccurrence(
  freightId: string,
  type: string,
  description: string,
): Promise<FreightOccurrence> {
  if (shouldUseMocks()) return mock.mockAddOccurrence(freightId, type, description)
  return apiRequest(`/freights/${freightId}/occurrences`, {
    method: "POST",
    body: { type, description },
    auth: true,
  })
}

export async function listCustomers(): Promise<Customer[]> {
  if (shouldUseMocks()) return mock.mockCustomers()
  // Backend uses /clients (CPF/CNPJ-based clients)
  return apiRequest<{ items: Customer[] }>("/clients?size=100", { auth: true })
    .then((res) => res.items ?? [])
    .catch(() => [])
}
