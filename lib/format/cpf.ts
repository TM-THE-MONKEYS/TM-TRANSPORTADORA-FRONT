/** Remove máscara e mantém só dígitos do CPF. */
export function stripCpf(value: string): string {
  return value.replace(/\D/g, "")
}

/** Máscara 000.000.000-00 enquanto digita. */
export function formatCpf(value: string): string {
  const digits = stripCpf(value).slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/** Validação básica de tamanho (dígito verificador é validado no backend). */
export function isValidCpfLength(value: string): boolean {
  return stripCpf(value).length === 11
}
