import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import { normalizeUserRead, toUserCreatePayload } from "@/lib/api/adapters/users"
import * as mock from "@/lib/mocks/handlers"
import type { UserRead } from "@/types"

export type CreateUserInput = {
  nome: string
  email: string
  password: string
  role: "motorista"
  is_active?: boolean
  /** Mock only — vincula driver_id no usuário criado. */
  driver_id?: string
}

export async function createUser(input: CreateUserInput): Promise<UserRead> {
  if (shouldUseMocks()) return mock.mockCreateUser(input)
  const raw = await apiRequest<Record<string, unknown>>("/users", {
    method: "POST",
    body: toUserCreatePayload(input),
    auth: true,
  })
  return normalizeUserRead(raw)
}

export async function deleteUser(userId: string): Promise<void> {
  if (shouldUseMocks()) return mock.mockDeleteUser(userId)
  await apiRequest(`/users/${userId}`, { method: "DELETE", auth: true })
}
