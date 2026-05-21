import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import * as mock from "@/lib/mocks/handlers"
import type {
  Branch,
  Customer,
  FreightEvent,
  FreightOccurrence,
  FreightOrder,
  FreightStatus,
  Paginated,
} from "@/types"

export async function listFreights(page = 1, pageSize = 20): Promise<Paginated<FreightOrder>> {
  if (shouldUseMocks()) return mock.mockListFreights(page, pageSize)
  return apiRequest(`/freight/orders?page=${page}&page_size=${pageSize}`, { auth: true })
}

export async function getFreight(id: string): Promise<FreightOrder> {
  if (shouldUseMocks()) {
    const f = await mock.mockGetFreight(id)
    if (!f) throw new Error("Frete não encontrado")
    return f
  }
  return apiRequest(`/freight/orders/${id}`, { auth: true })
}

export async function createFreight(
  data: Omit<FreightOrder, "id" | "code" | "created_at" | "updated_at" | "tenant_id">,
): Promise<FreightOrder> {
  if (shouldUseMocks()) return mock.mockCreateFreight(data)
  return apiRequest("/freight/orders", { method: "POST", body: data, auth: true })
}

export async function updateFreight(id: string, data: Partial<FreightOrder>): Promise<FreightOrder> {
  if (shouldUseMocks()) return mock.mockUpdateFreight(id, data)
  return apiRequest(`/freight/orders/${id}`, { method: "PATCH", body: data, auth: true })
}

export async function advanceFreightStatus(id: string): Promise<FreightOrder> {
  if (shouldUseMocks()) return mock.mockAdvanceFreightStatus(id)
  return apiRequest(`/freight/orders/${id}/advance-status`, { method: "POST", auth: true })
}

export async function updateFreightStatus(id: string, status: FreightStatus): Promise<FreightOrder> {
  if (shouldUseMocks()) return mock.mockUpdateFreightStatus(id, status)
  return apiRequest(`/freight/orders/${id}/status`, {
    method: "PATCH",
    body: { status },
    auth: true,
  })
}

export async function getFreightEvents(freightId: string): Promise<FreightEvent[]> {
  if (shouldUseMocks()) return mock.mockListFreightEvents(freightId)
  return apiRequest(`/freight/orders/${freightId}/events`, { auth: true })
}

export async function getFreightOccurrences(freightId: string): Promise<FreightOccurrence[]> {
  if (shouldUseMocks()) return mock.mockFreightOccurrences(freightId)
  return apiRequest(`/freight/orders/${freightId}/occurrences`, { auth: true })
}

export async function addOccurrence(
  freightId: string,
  type: string,
  description: string,
): Promise<FreightOccurrence> {
  if (shouldUseMocks()) return mock.mockAddOccurrence(freightId, type, description)
  return apiRequest(`/freight/orders/${freightId}/occurrences`, {
    method: "POST",
    body: { type, description },
    auth: true,
  })
}

export async function listCustomers(): Promise<Customer[]> {
  if (shouldUseMocks()) return mock.mockCustomers()
  return apiRequest("/customers", { auth: true })
}

export async function listBranches(): Promise<Branch[]> {
  if (shouldUseMocks()) return mock.mockBranches()
  return apiRequest<Branch[]>("/branches", { auth: true })
}
