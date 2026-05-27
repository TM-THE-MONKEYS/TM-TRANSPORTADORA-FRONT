const DEFAULT_FALLBACK = "/dashboard"

/** Only same-origin relative paths; blocks open redirects (//evil.com, https://…). */
export function getSafeRedirectPath(
  from: string | null | undefined,
  fallback = DEFAULT_FALLBACK,
): string {
  if (!from || typeof from !== "string") return fallback

  const trimmed = from.trim()
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback
  if (trimmed.includes("\\") || trimmed.includes("@")) return fallback

  try {
    const parsed = new URL(trimmed, "http://local.invalid")
    if (parsed.origin !== "http://local.invalid") return fallback
    if (parsed.pathname.includes("..")) return fallback
  } catch {
    return fallback
  }

  return trimmed
}
