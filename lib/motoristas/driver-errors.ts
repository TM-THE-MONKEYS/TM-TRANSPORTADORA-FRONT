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

    if (error.status === 409 && msg.includes("e-mail")) {
      return "E-mail já cadastrado. Use outro e-mail de login."
    }

    return error.message
  }

  if (error instanceof Error) return error.message
  return "Erro ao salvar motorista"
}
