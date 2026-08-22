import { permissionsForRole } from "@/lib/rbac/permissions"
import { isEmailLoginIdentifier } from "@/lib/auth/login-identifier"
import { stripCpf } from "@/lib/format/cpf"
import { generateId, mockStore } from "@/lib/mocks/store"
import type { AuthTokens, AuthUser } from "@/types"

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Auth mocks only — safe for App Router (no SWR / client services). */
export async function mockLogin(identifier: string, password: string): Promise<{
  tokens: AuthTokens
  user: AuthUser
}> {
  await delay(300)
  const trimmed = identifier.trim()
  let record = isEmailLoginIdentifier(trimmed)
    ? mockStore.users[trimmed.toLowerCase()]
    : undefined

  if (!record) {
    const cpfDigits = stripCpf(trimmed)
    const driver = mockStore.drivers.find((d) => stripCpf(d.cpf ?? "") === cpfDigits)
    if (driver?.user_id) {
      record = Object.values(mockStore.users).find((u) => u.id === driver.user_id)
    }
  }

  if (!record || record.password !== password) {
    throw new Error("Credenciais inválidas")
  }
  const { password: _, ...user } = record
  user.permissions = permissionsForRole(user.role)
  return {
    tokens: {
      access_token: `mock-access-${user.id}`,
      refresh_token: `mock-refresh-${user.id}`,
      token_type: "bearer",
    },
    user: {
      ...user,
      must_change_password: record.must_change_password ?? false,
    },
  }
}

export async function mockMe(accessToken: string): Promise<AuthUser> {
  await delay(100)
  const id = accessToken.replace("mock-access-", "")
  const user = Object.values(mockStore.users).find((u) => u.id === id)
  if (!user) throw new Error("Sessão inválida")
  const { password: _, ...rest } = user
  rest.permissions = permissionsForRole(rest.role)
  return {
    ...rest,
    must_change_password: user.must_change_password ?? false,
  }
}

export async function mockForgotPassword(email: string): Promise<void> {
  await delay(300)
  const normalized = email.trim().toLowerCase()
  if (!mockStore.users[normalized]) return
  const token = generateId("reset")
  mockStore.passwordResetTokens[token] = {
    email: normalized,
    expiresAt: Date.now() + 60 * 60 * 1000,
  }
}

export async function mockResetPassword(token: string, newPassword: string): Promise<void> {
  await delay(300)
  const entry = mockStore.passwordResetTokens[token]
  if (!entry || entry.expiresAt < Date.now()) {
    throw new Error("Link inválido ou expirado")
  }
  const user = mockStore.users[entry.email]
  if (!user) throw new Error("Usuário não encontrado")
  user.password = newPassword
  user.must_change_password = false
  delete mockStore.passwordResetTokens[token]
}

export async function mockChangePassword(
  currentPassword: string,
  newPassword: string,
  accessToken?: string,
): Promise<void> {
  await delay(300)
  const token = accessToken ?? ""
  const id = token.replace("mock-access-", "")
  const user = Object.values(mockStore.users).find((u) => u.id === id)
  if (!user) throw new Error("Sessão inválida")
  if (user.password !== currentPassword) throw new Error("Senha atual incorreta")
  user.password = newPassword
  user.must_change_password = false
}
