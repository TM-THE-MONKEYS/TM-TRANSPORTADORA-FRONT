import { requirePublicApiUrl, shouldUseMocks } from "@/lib/api/config"
import { ApiError, formatFastApiDetail } from "@/lib/api/errors"
import {
  getStoredAccessToken,
  getStoredBranchId,
  getStoredTenantId,
} from "@/lib/api/storage"
import type { FastApiErrorBody } from "@/lib/api/types"

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  auth?: boolean
  accessToken?: string | null
  tenantId?: string | null
  branchId?: string | null
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  if (shouldUseMocks()) {
    throw new Error("MOCK_HANDLER")
  }

  const { method = "GET", body, auth = false, accessToken, tenantId, branchId } = options
  const base = requirePublicApiUrl()
  const url = `${base}/api/v1${path.startsWith("/") ? path : `/${path}`}`

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
    const tid = tenantId ?? getStoredTenantId()
    if (tid) headers["X-Tenant-Id"] = tid
    const bid = branchId ?? getStoredBranchId()
    if (bid) headers["X-Branch-Id"] = bid
  }

  let res: Response
  try {
    res = await fetch(url, { method, headers, body: payload, cache: "no-store" })
  } catch (err) {
    const hint =
      err instanceof TypeError && err.message === "Failed to fetch"
        ? `Não foi possível conectar à API em ${base}. Verifique se o backend está rodando (porta 8000).`
        : "Erro de rede ao chamar a API."
    throw new ApiError(0, hint)
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
