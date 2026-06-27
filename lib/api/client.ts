import { buildApiV1Url, getClientApiBaseUrl, requirePublicApiUrl, shouldUseMocks } from "@/lib/api/config"
import { ApiError, formatFastApiDetail } from "@/lib/api/errors"
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredSession,
} from "@/lib/api/storage"
import type { AuthTokens, AuthUser } from "@/types"
import type { FastApiErrorBody } from "@/lib/api/types"

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  auth?: boolean
  accessToken?: string | null
  tenantId?: string | null
  branchId?: string | null
  /** Internal: evita loop infinito no refresh */
  _retry?: boolean
}

type LoginResponse = { tokens: AuthTokens; user: AuthUser }

async function refreshAccessToken(): Promise<string> {
  const refresh = getStoredRefreshToken()
  if (!refresh) throw new ApiError(401, "Sessão expirada. Faça login novamente.")

  const base = requirePublicApiUrl()
  const res = await fetch(buildApiV1Url("/auth/refresh", getClientApiBaseUrl() || base), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
    cache: "no-store",
  })

  const text = await res.text()
  let json: unknown = {}
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = { detail: text }
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, formatFastApiDetail(json as FastApiErrorBody))
  }

  const session = json as LoginResponse
  setStoredSession(
    session.tokens.access_token,
    session.tokens.refresh_token,
    session.user.tenant_id,
    session.user.branch_id,
  )
  return session.tokens.access_token
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  if (shouldUseMocks()) {
    throw new Error("MOCK_HANDLER")
  }

  const {
    method = "GET",
    body,
    auth = false,
    accessToken,
    _retry = false,
  } = options

  requirePublicApiUrl()
  const url = buildApiV1Url(path)

  const headers: Record<string, string> = { Accept: "application/json" }

  let payload: string | undefined
  if (body !== undefined) {
    headers["Content-Type"] = "application/json"
    payload = JSON.stringify(body)
  }

  const bearer = accessToken ?? (auth ? getStoredAccessToken() : null)
  if (auth) {
    if (!bearer) throw new ApiError(401, "Sessão expirada. Faça login novamente.")
    headers.Authorization = `Bearer ${bearer}`
    // Tenant/branch come from JWT on the backend. Custom headers trigger CORS preflight
    // and tm-transportadora-api does not allow X-Tenant-Id / X-Branch-Id in ACAH yet.
  }

  let res: Response
  try {
    res = await fetch(url, { method, headers, body: payload, cache: "no-store" })
  } catch (err) {
    const remote = requirePublicApiUrl()
    const hint =
      err instanceof TypeError && err.message === "Failed to fetch"
        ? process.env.NODE_ENV === "development"
          ? `Não foi possível conectar à API (${remote}). Verifique se o backend está no ar e reinicie o npm run dev após alterar .env.local.`
          : `Não foi possível conectar à API em ${remote}. Verifique se o backend está rodando.`
        : "Erro de rede ao chamar a API."
    throw new ApiError(0, hint)
  }

  if (res.status === 401 && auth && !_retry) {
    try {
      const newToken = await refreshAccessToken()
      return apiRequest<T>(path, { ...options, accessToken: newToken, _retry: true })
    } catch {
      throw new ApiError(401, "Sessão expirada. Faça login novamente.")
    }
  }

  if (res.status === 204) {
    return undefined as T
  }

  const text = await res.text()
  let json: unknown = {}
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = { detail: text || res.statusText }
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, formatFastApiDetail(json as FastApiErrorBody))
  }

  return json as T
}

export async function checkApiHealth(): Promise<{ status: string; version?: string }> {
  if (shouldUseMocks()) return { status: "ok", version: "mock" }
  requirePublicApiUrl()
  const base = getClientApiBaseUrl()
  const healthUrl = base ? `${base}/health` : "/api/backend-health"
  const res = await fetch(healthUrl, { cache: "no-store" })
  if (!res.ok) throw new ApiError(res.status, "API indisponível")
  return res.json()
}
