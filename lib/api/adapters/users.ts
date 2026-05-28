import type { UserRead } from "@/types"
import type { CreateUserInput } from "@/lib/api/services/users"

export function toUserCreatePayload(input: CreateUserInput): Record<string, unknown> {
  return {
    nome: input.nome.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    role: input.role,
    is_active: input.is_active ?? true,
  }
}

export function normalizeUserRead(raw: Record<string, unknown>): UserRead {
  return {
    id: String(raw.id),
    nome: String(raw.nome ?? raw.name ?? ""),
    email: String(raw.email),
    role: raw.role as UserRead["role"],
    is_active: Boolean(raw.is_active ?? true),
    created_at: String(raw.created_at ?? new Date().toISOString()),
    updated_at: String(raw.updated_at ?? new Date().toISOString()),
  }
}
