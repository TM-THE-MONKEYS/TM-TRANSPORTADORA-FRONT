import { z } from "zod"

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Precisa de uma letra maiúscula")
  .regex(/[0-9]/, "Precisa de um número")

/** Senha provisória legível — 1 maiúscula, 1 número, 6 aleatórios. */
export function generateProvisionalPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const lower = "abcdefghjkmnpqrstuvwxyz"
  const digits = "23456789"
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)]
  const rest = Array.from({ length: 6 }, () => pick(upper + lower + digits)).join("")
  return `${pick(upper)}${pick(digits)}${rest}`
}
