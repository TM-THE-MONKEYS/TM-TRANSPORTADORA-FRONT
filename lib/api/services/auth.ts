import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
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

export async function login(input: LoginInput): Promise<{ tokens: AuthTokens; user: AuthUser }> {
  if (shouldUseMocks()) return mock.mockLogin(input.email, input.password)
  return apiRequest("/auth/login", { method: "POST", body: input })
}

export async function registerTenant(
  input: RegisterTenantInput,
): Promise<{ tokens: AuthTokens; user: AuthUser }> {
  if (shouldUseMocks()) return mock.mockRegisterTenant(input)
  return apiRequest("/auth/register-tenant", { method: "POST", body: input })
}

export async function getMe(accessToken: string): Promise<AuthUser> {
  if (shouldUseMocks()) return mock.mockMe(accessToken)
  return apiRequest("/auth/me", { auth: true, accessToken })
}

export async function refreshToken(refresh: string): Promise<AuthTokens> {
  if (shouldUseMocks()) {
    const userId = refresh.replace("mock-refresh-", "")
    return {
      access_token: `mock-access-${userId}`,
      refresh_token: refresh,
      token_type: "bearer",
    }
  }
  return apiRequest("/auth/refresh", { method: "POST", body: { refresh_token: refresh } })
}
