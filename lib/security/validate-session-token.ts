import { shouldUseMocks } from "@/lib/api/config"

const MOCK_ACCESS_TOKEN = /^mock-access-[a-zA-Z0-9_-]+$/

function isMockAccessToken(token: string): boolean {
  return MOCK_ACCESS_TOKEN.test(token)
}

/** Server-side: rejects forged cookies before setting tmt_session. */
export async function isAccessTokenValid(accessToken: string): Promise<boolean> {
  const token = accessToken.trim()
  if (!token) return false

  if (shouldUseMocks() && isMockAccessToken(token)) {
    return true
  }

  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "")
  if (!base) {
    // Mock tokens only in non-production without API URL.
    if (process.env.NODE_ENV === "production") return false
    return isMockAccessToken(token)
  }

  try {
    const res = await fetch(`${base}/api/v1/auth/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
    return res.ok
  } catch {
    return false
  }
}
