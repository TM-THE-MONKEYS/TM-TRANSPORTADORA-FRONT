import { redirect } from "next/navigation"

/**
 * Cadastro público de empresa desabilitado — produto single-tenant (uma empresa).
 * Contas de motorista/admin são criadas pelo administrador no painel.
 */
export default function CadastroPage() {
  redirect("/")
}
