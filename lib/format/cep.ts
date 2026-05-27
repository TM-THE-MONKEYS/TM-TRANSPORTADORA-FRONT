/** Remove máscara e mantém só dígitos do CEP. */
export function stripCep(value: string): string {
  return value.replace(/\D/g, "")
}

/** Máscara 00000-000 enquanto digita. */
export function formatCep(value: string): string {
  const digits = stripCep(value).slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function isValidCepLength(value: string): boolean {
  return stripCep(value).length === 8
}
