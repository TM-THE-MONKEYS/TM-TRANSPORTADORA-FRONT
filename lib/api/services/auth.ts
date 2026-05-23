import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import { normalizeAuthUser } from "@/lib/api/adapters/auth"
import * as mock from "@/lib/mocks/handlers"
import type { AuthTokens, AuthUser } from "@/types"

export type LoginInput = { email: string; password: string }

export type RegisterTenantInput = {
  tenant_name: string
  document?: string
  admin_name: string
  email: string
  password: string
}

export type LoginResponse = { tokens: AuthTokens; user: AuthUser }

async function normalizeSession(session: LoginResponse): Promise<LoginResponse> {
  return { ...session, user: normalizeAuthUser(session.user) }
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  if (shouldUseMocks()) return mock.mockLogin(input.email, input.password)
  const session = await apiRequest<LoginResponse>("/auth/login", { method: "POST", body: input })
  return normalizeSession(session)
}

export async function registerTenant(input: RegisterTenantInput): Promise<LoginResponse> {
  if (shouldUseMocks()) return mock.mockRegisterTenant(input)
  const session = await apiRequest<LoginResponse>("/auth/register-tenant", {
    method: "POST",
    body: input,
  })
  return normalizeSession(session)
}

export async function getMe(accessToken?: string): Promise<AuthUser> {
  if (shouldUseMocks()) {
    const token = accessToken ?? ""
    return mock.mockMe(token)
  }
  const user = await apiRequest<AuthUser>("/auth/me", { auth: true, accessToken })
  return normalizeAuthUser(user)
}

export async function refreshToken(refresh: string): Promise<LoginResponse> {
  if (shouldUseMocks()) {
    const userId = refresh.replace("mock-refresh-", "")
    return {
      tokens: {
        access_token: `mock-access-${userId}`,
        refresh_token: refresh,
        token_type: "bearer",
      },
      user: await mock.mockMe(`mock-access-${userId}`),
    }
  }
  const session = await apiRequest<LoginResponse>("/auth/refresh", {
    method: "POST",
    body: { refresh_token: refresh },
  })
  return normalizeSession(session)
}

export async function logout(refreshToken: string): Promise<void> {
  if (shouldUseMocks()) return
  await apiRequest("/auth/logout", {
    method: "POST",
    body: { refresh_token: refreshToken },
  })
}

export async function logoutAll(): Promise<void> {
  if (shouldUseMocks()) return
  await apiRequest("/auth/logout-all", { method: "POST", auth: true })
}
