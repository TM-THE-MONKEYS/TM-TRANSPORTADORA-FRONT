export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "")
  if (!apiUrl) {
    return Response.json({ healthy: false, error: "NEXT_PUBLIC_API_URL not set" }, { status: 503 })
  }

  const checks = { api: false, database: false, latency_ms: 0 }

  const start = Date.now()
  try {
    const res = await fetch(`${apiUrl}/health`, { cache: "no-store" })
    checks.latency_ms = Date.now() - start
    if (res.ok) {
      const data = await res.json()
      checks.api = true
      checks.database = data.database !== false
    }
  } catch {
    checks.latency_ms = Date.now() - start
  }

  const healthy = checks.api && checks.database

  console.log(
    JSON.stringify({
      event: "health_check",
      healthy,
      ...checks,
      timestamp: new Date().toISOString(),
    }),
  )

  return Response.json({ healthy, ...checks }, { status: healthy ? 200 : 503 })
}
