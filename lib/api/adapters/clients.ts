import type { Customer } from "@/types"

/** Shape parcial de ClientRead/ListItem do backend (português). */
export type BackendClient = {
  id: string
  tenant_id?: string
  nome: string
  cpf_cnpj?: string | null
  email?: string | null
  telefone?: string | null
  is_active?: boolean
}

export function mapClient(item: BackendClient): Customer {
  return {
    id: item.id,
    tenant_id: item.tenant_id ?? "default",
    name: item.nome,
    nome: item.nome,
    cpf_cnpj: item.cpf_cnpj ?? undefined,
    document: item.cpf_cnpj ?? undefined,
    email: item.email ?? undefined,
    phone: item.telefone ?? undefined,
    telefone: item.telefone ?? undefined,
  }
}

export function getCustomerLabel(c: Customer): string {
  return c.name ?? c.nome ?? c.id
}
