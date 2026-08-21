import { NextResponse } from "next/server"
import {
  backendApiBase,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth/session-cookies"
import {
  isEmailLoginIdentifier,
  normalizeDriverLoginCpf,
  normalizeStaffLoginEmail,
} from "@/lib/auth/login-identifier"
import { isValidCpfLength } from "@/lib/format/cpf"
import { normalizeAuthUser } from "@/lib/api/adapters/auth"

type LoginResponse = {
  tokens: { access_token: string; refresh_token: string }
  user: Record<string, unknown>
}

async function postBackendLogin(
  path: string,
  body: Record<string, string>,
): Promise<{ ok: true; data: LoginResponse } | { ok: false; status: number; detail: string }> {
  const base = backendApiBase()
  if (!base) {
    return { ok: false, status: 500, detail: "NEXT_PUBLIC_API_URL não configurada" }
  }

  const res = await fetch(`${base}/api/v1${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  const json = (await res.json().catch(() => ({}))) as LoginResponse & { detail?: unknown }
  if (!res.ok) {
    const detail =
      typeof json.detail === "string"
        ? json.detail
        : Array.isArray(json.detail)
          ? JSON.stringify(json.detail)
          : "Falha no login"
    return { ok: false, status: res.status, detail }
  }
  return { ok: true, data: json as LoginResponse }
}

/** Login server-side: tokens só em cookies httpOnly; client recebe só o user. */
export async function POST(request: Request) {
  const body = (await request.json()) as { identifier?: string; password?: string }
  const identifier = (body.identifier ?? "").trim()
  const password = body.password ?? ""

  if (!identifier || !password) {
    return NextResponse.json({ error: "Identificador e senha obrigatórios" }, { status: 400 })
  }

  let result: Awaited<ReturnType<typeof postBackendLogin>>

  if (isEmailLoginIdentifier(identifier)) {
    result = await postBackendLogin("/auth/login", {
      email: normalizeStaffLoginEmail(identifier),
      password,
    })
    if (
      !result.ok &&
      (result.detail.toLowerCase().includes("driver/login") ||
        result.detail.toLowerCase().includes("motoristas devem"))
    ) {
      return NextResponse.json(
        {
          error:
            "Contas de motorista entram com o CPF cadastrado (11 dígitos), não com e-mail.",
        },
        { status: 400 },
      )
    }
  } else if (!isValidCpfLength(identifier)) {
    return NextResponse.json(
      { error: "Informe um e-mail válido ou CPF com 11 dígitos." },
      { status: 400 },
    )
  } else {
    result = await postBackendLogin("/auth/driver/login", {
      cpf: normalizeDriverLoginCpf(identifier),
      password,
    })
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: result.status })
  }

  const user = normalizeAuthUser(result.data.user as never)
  const res = NextResponse.json({ user })
  setAuthCookies(res, result.data.tokens.access_token, result.data.tokens.refresh_token)
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  clearAuthCookies(res)
  return res
}
