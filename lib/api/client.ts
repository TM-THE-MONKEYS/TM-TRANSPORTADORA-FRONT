import { buildApiV1Url, getClientApiBaseUrl, requirePublicApiUrl, shouldUseMocks } from "@/lib/api/config"
import { ApiError, formatFastApiDetail } from "@/lib/api/errors"
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

async function refreshSessionViaBff(): Promise<void> {
  const res = await fetch("/api/auth/me", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  })
  if (!res.ok) {
    throw new ApiError(401, "Sessão expirada. Faça login novamente.")
  }
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

  // Browser usa BFF same-origin (cookie httpOnly). accessToken só para mocks/SSR legado.
  const bearer = accessToken ?? null
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`
  } else if (auth && typeof window === "undefined") {
    throw new ApiError(401, "Sessão expirada. Faça login novamente.")
  }

  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers,
      body: payload,
      cache: "no-store",
      credentials: "include",
    })
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

  if (res.status === 401 && auth && !_retry && typeof window !== "undefined") {
    try {
      await refreshSessionViaBff()
      return apiRequest<T>(path, { ...options, _retry: true })
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
  const res = await fetch(healthUrl, { cache: "no-store", credentials: "include" })
  if (!res.ok) throw new ApiError(res.status, "API indisponível")
  return res.json()
}
