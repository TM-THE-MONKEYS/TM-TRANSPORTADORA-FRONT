import { apiRequest } from "@/lib/api/client"
import { shouldUseMocks } from "@/lib/api/config"
import { ApiError } from "@/lib/api/errors"
import { normalizeAuthUser } from "@/lib/api/adapters/auth"
import * as mock from "@/lib/mocks/handlers"
import type { AuthTokens, AuthUser } from "@/types"

export type LoginInput = { identifier: string; password: string }

export type LoginResponse = { tokens: AuthTokens; user: AuthUser }

/** Login via BFF: cookies httpOnly; retorna só user (tokens fictícios p/ tipagem). */
export async function login(input: LoginInput): Promise<LoginResponse> {
  if (shouldUseMocks()) return mock.mockLogin(input.identifier, input.password)

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
    cache: "no-store",
  })
  const json = (await res.json().catch(() => ({}))) as { user?: AuthUser; error?: string }
  if (!res.ok || !json.user) {
    throw new ApiError(res.status || 400, json.error ?? "Falha no login")
  }
  const user = normalizeAuthUser(json.user)
  return {
    user,
    tokens: {
      access_token: "",
      refresh_token: "",
      token_type: "bearer",
    },
  }
}

export async function getMe(_accessToken?: string): Promise<AuthUser> {
  if (shouldUseMocks()) {
    return mock.mockMe(_accessToken ?? "")
  }
  const res = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  })
  if (!res.ok) {
    throw new ApiError(res.status, "Sessão inválida")
  }
  const user = (await res.json()) as AuthUser
  return normalizeAuthUser(user)
}

export async function refreshToken(_refresh: string): Promise<LoginResponse> {
  if (shouldUseMocks()) {
    return {
      tokens: {
        access_token: "mock-access",
        refresh_token: _refresh,
        token_type: "bearer",
      },
      user: await mock.mockMe("mock-access"),
    }
  }
  const res = await fetch("/api/auth/me", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  })
  if (!res.ok) {
    throw new ApiError(401, "Sessão expirada")
  }
  const json = (await res.json()) as { user: AuthUser }
  return {
    user: normalizeAuthUser(json.user),
    tokens: { access_token: "", refresh_token: "", token_type: "bearer" },
  }
}

export async function logout(_refreshToken?: string): Promise<void> {
  if (shouldUseMocks()) return
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  })
}

export async function logoutAll(): Promise<void> {
  if (shouldUseMocks()) return
  await apiRequest("/auth/logout-all", { method: "POST", auth: true })
}

export async function forgotPassword(email: string): Promise<void> {
  if (shouldUseMocks()) return mock.mockForgotPassword(email)
  await apiRequest("/auth/forgot-password", {
    method: "POST",
    body: { email: email.trim().toLowerCase() },
  })
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (shouldUseMocks()) return mock.mockResetPassword(token, newPassword)
  await apiRequest("/auth/reset-password", {
    method: "POST",
    body: { token, new_password: newPassword },
  })
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  if (shouldUseMocks()) {
    return mock.mockChangePassword(currentPassword, newPassword, undefined)
  }
  await apiRequest("/auth/change-password", {
    method: "POST",
    body: { current_password: currentPassword, new_password: newPassword },
    auth: true,
  })
}
