import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import { mapClient, type BackendClient } from "@/lib/api/adapters/clients"
import { generateProvisionalCnpj } from "@/lib/format/numbers"
import * as mock from "@/lib/mocks/handlers"
import type { Customer, Paginated } from "@/types"

export async function listClients(page = 1, size = 100, search?: string): Promise<Customer[]> {
  if (shouldUseMocks()) return mock.mockListClients(search)
  const qs = new URLSearchParams({ page: String(page), size: String(size) })
  if (search?.trim()) qs.set("search", search.trim())
  const res = await apiRequest<Paginated<BackendClient>>(`/clients?${qs}`, { auth: true })
  return (res.items ?? []).map(mapClient)
}

export async function createClient(data: {
  nome: string
  cpf_cnpj?: string
  email?: string
  telefone?: string
}): Promise<Customer> {
  const body = {
    ...data,
    cpf_cnpj: data.cpf_cnpj ?? generateProvisionalCnpj(data.nome),
  }
  if (shouldUseMocks()) return mock.mockCreateClient(body)
  const created = await apiRequest<BackendClient>("/clients", {
    method: "POST",
    body,
    auth: true,
  })
  return mapClient(created)
}

export async function updateClient(
  id: string,
  data: { nome?: string; cpf_cnpj?: string; email?: string; telefone?: string },
): Promise<Customer> {
  if (shouldUseMocks()) {
    const { mockStore } = await import("@/lib/mocks/store")
    const idx = mockStore.customers.findIndex((c) => c.id === id)
    if (idx >= 0) {
      const prev = mockStore.customers[idx]
      const updated = {
        ...prev,
        name: data.nome ?? prev.name,
        nome: data.nome ?? prev.nome,
        cpf_cnpj: data.cpf_cnpj ?? prev.cpf_cnpj,
        document: data.cpf_cnpj ?? prev.document,
        email: data.email ?? prev.email,
        phone: data.telefone ?? prev.phone,
        telefone: data.telefone ?? prev.telefone,
      }
      mockStore.customers[idx] = updated
      return updated as Customer
    }
    throw new Error("Cliente não encontrado")
  }
  const updated = await apiRequest<BackendClient>(`/clients/${id}`, {
    method: "PATCH",
    body: data,
    auth: true,
  })
  return mapClient(updated)
}

export async function deleteClient(id: string): Promise<void> {
  if (shouldUseMocks()) {
    const { mockStore } = await import("@/lib/mocks/store")
    mockStore.customers = mockStore.customers.filter((c) => c.id !== id)
    return
  }
  await apiRequest(`/clients/${id}`, { method: "DELETE", auth: true })
}

/** Cria ou reutiliza cliente pelo nome (ordem de frete sem cadastro prévio). */
export async function findOrCreateClientByName(name: string): Promise<Customer> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error("Informe o nome do cliente")

  const existing = await listClients(1, 50, trimmed)
  const match = existing.find(
    (c) => (c.name ?? c.nome ?? "").toLowerCase() === trimmed.toLowerCase(),
  )
  if (match) return match

  return createClient({
    nome: trimmed,
  })
}
