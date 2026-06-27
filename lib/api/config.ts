export function getPublicApiUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "")
}

/**
 * Base da API no browser. Em dev, usa proxy same-origin (/api/v1 → Railway)
 * porque o backend em produção não libera CORS para localhost.
 */
export function getClientApiBaseUrl(): string {
  const remote = getPublicApiUrl()
  if (!remote) return ""
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    return ""
  }
  return remote
}

export function buildApiV1Url(path: string, base = getClientApiBaseUrl()): string {
  const suffix = path.startsWith("/") ? path : `/${path}`
  return base ? `${base}/api/v1${suffix}` : `/api/v1${suffix}`
}

export function isApiUrlConfigured(): boolean {
  return getPublicApiUrl().length > 0
}

export function shouldUseMocks(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "false") return false
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") return true
  // Production must not silently fall back to seeded demo credentials.
  if (process.env.NODE_ENV === "production") return false
  return !isApiUrlConfigured()
}

export function requirePublicApiUrl(): string {
  const url = getPublicApiUrl()
  if (!url) {
    throw new Error(
      "Configure NEXT_PUBLIC_API_URL no .env.local (ex.: http://127.0.0.1:8000) ou use NEXT_PUBLIC_USE_MOCKS=true.",
    )
  }
  return url
}
