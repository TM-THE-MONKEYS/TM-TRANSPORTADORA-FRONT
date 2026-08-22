import { NextResponse } from "next/server"

/**
 * Cadastro público de empresa desabilitado — produto single-tenant.
 * Contas são criadas pelo administrador no painel.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Cadastro público desabilitado. Contate o administrador." },
    { status: 403 },
  )
}
