import { stripCpf } from "@/lib/format/cpf"
import type { Driver, DriverStatus } from "@/types"

/** Payload em inglês — o backend mapeia via DRIVER_CREATE_ALIASES; cpf permanece cpf. */
export function toDriverCreatePayload(
  data: Omit<Driver, "id" | "created_at" | "tenant_id">,
): Record<string, unknown> {
  const cpf = data.cpf ? stripCpf(data.cpf) : ""
  const payload: Record<string, unknown> = {
    name: data.name,
    cpf,
    cnh_number: data.cnh_number,
    cnh_category: data.cnh_category,
    cnh_expires_at: data.cnh_expires_at,
    status: data.status as DriverStatus,
  }
  if (data.phone?.trim()) payload.phone = data.phone.trim()
  return payload
}

export function toDriverUpdatePayload(data: Partial<Driver>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (data.name !== undefined) payload.nome = data.name
  if (data.phone !== undefined) payload.telefone = data.phone
  if (data.cnh_category !== undefined) payload.cnh_category = data.cnh_category
  if (data.cnh_expires_at !== undefined) payload.cnh_expiry = data.cnh_expires_at
  if (data.status !== undefined) payload.status = data.status
  if (data.user_id !== undefined) payload.user_id = data.user_id
  if (data.email !== undefined) payload.email = data.email
  return payload
}
