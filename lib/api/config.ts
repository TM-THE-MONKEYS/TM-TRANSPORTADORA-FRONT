export function getPublicApiUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "")
}

export function isApiUrlConfigured(): boolean {
  return getPublicApiUrl().length > 0
}

export function shouldUseMocks(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "false") return false
  return !isApiUrlConfigured() || process.env.NEXT_PUBLIC_USE_MOCKS === "true"
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
