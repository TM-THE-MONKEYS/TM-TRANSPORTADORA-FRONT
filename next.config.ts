import type { NextConfig } from "next"

const publicApiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "")

/** Inclui localhost e 127.0.0.1 quando a API local estiver configurada. */
function localApiConnectSources(baseUrl: string): string[] {
  if (!baseUrl) return []
  const urls = [baseUrl]
  if (baseUrl.includes("localhost")) {
    urls.push(baseUrl.replace("localhost", "127.0.0.1"))
  } else if (baseUrl.includes("127.0.0.1")) {
    urls.push(baseUrl.replace("127.0.0.1", "localhost"))
  }
  return urls
}

const connectSrc = [
  "'self'",
  ...localApiConnectSources(publicApiUrl),
  "https://api-production-a071.up.railway.app",
  "https://jkdkspbcqnfrweanmhpp.supabase.co",
  "https://va.vercel-scripts.com",
  "https://viacep.com.br",
].join(" ")

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src ${connectSrc}`,
      "frame-ancestors 'none'",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "jkdkspbcqnfrweanmhpp.supabase.co" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
}

export default nextConfig
