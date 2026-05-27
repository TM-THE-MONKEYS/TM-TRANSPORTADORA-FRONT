import { stripCep } from "@/lib/format/cep"

export type ViaCepAddress = {
  cep: string
  street: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

type ViaCepResponse = {
  cep?: string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepAddress> {
  const digits = stripCep(cep)
  if (digits.length !== 8) {
    throw new Error("CEP deve ter 8 dígitos")
  }

  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Não foi possível consultar o CEP")
  }

  const data = (await res.json()) as ViaCepResponse
  if (data.erro) {
    throw new Error("CEP não encontrado")
  }

  return {
    cep: formatCepFromDigits(digits),
    street: data.logradouro?.trim() ?? "",
    complement: data.complemento?.trim() ?? "",
    neighborhood: data.bairro?.trim() ?? "",
    city: data.localidade?.trim() ?? "",
    state: data.uf?.trim().toUpperCase() ?? "",
  }
}

function formatCepFromDigits(digits: string): string {
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}
