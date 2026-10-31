import { ApiError } from "@/lib/api/errors"

export function formatDriverSaveError(error: unknown): string {
  if (error instanceof ApiError) {
    const msg = error.message.toLowerCase()

    if (error.status === 409 && msg.includes("cpf")) {
      return "CPF já cadastrado para outro motorista."
    }

    if (error.status === 409 && msg.includes("cnh")) {
      return "CNH já cadastrada para outro motorista."
    }

    if (
      error.status === 409 &&
      (msg.includes("e-mail") || msg.includes("email"))
    ) {
      return "E-mail já cadastrado. Use outro e-mail de login."
    }

    if (error.status === 409 && (msg.includes("conta") || msg.includes("acesso"))) {
      return "Motorista já possui conta de acesso."
    }

    if (error.status === 404 && msg.includes("conta")) {
      return "Motorista não possui conta de acesso."
    }

    return error.message
  }

  if (error instanceof Error) return error.message
  return "Erro ao salvar motorista"
}
