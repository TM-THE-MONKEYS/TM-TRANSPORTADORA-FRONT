export function getPublicApiUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "")
}

/**
 * Base da API no browser: sempre same-origin `/api/v1` (BFF Next injeta JWT
 * do cookie httpOnly). No server (RSC/route), usa a URL pública direta.
 */
export function getClientApiBaseUrl(): string {
  if (typeof window !== "undefined") return ""
  return getPublicApiUrl()
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
