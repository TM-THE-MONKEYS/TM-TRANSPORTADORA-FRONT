/** Mantém só dígitos. */
export function stripDigits(value: string): string {
  return value.replace(/\D/g, "")
}

/** Peso (kg) com separador de milhar: 28000 → "28.000" */
export function formatWeightInput(value: string): string {
  const digits = stripDigits(value)
  if (!digits) return ""
  return Number(digits).toLocaleString("pt-BR", { maximumFractionDigits: 0 })
}

export function parseWeightInput(value: string): number {
  const n = Number(stripDigits(value))
  return Number.isFinite(n) ? n : 0
}

/** Valor em reais (centavos na digitação): digita 1850050 → "18.500,50" */
export function formatMoneyInput(value: string): string {
  const digits = stripDigits(value)
  if (!digits) return ""
  const amount = Number(digits) / 100
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function parseMoneyInput(value: string): number {
  const digits = stripDigits(value)
  if (!digits) return 0
  return Number(digits) / 100
}

/** Litros: 1505 → "1.505,0" (uma casa decimal opcional). */
export function formatLitersInput(value: string): string {
  const raw = value.replace(/[^\d,]/g, "")
  if (!raw) return ""
  const [intPart, decPart] = raw.split(",")
  const digits = stripDigits(intPart ?? "")
  if (!digits) return decPart !== undefined ? `0,${decPart.slice(0, 1)}` : ""
  const formatted = Number(digits).toLocaleString("pt-BR", { maximumFractionDigits: 0 })
  if (decPart !== undefined) return `${formatted},${decPart.slice(0, 1)}`
  return formatted
}

export function parseLitersInput(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".")
  const n = parseFloat(normalized)
  return Number.isFinite(n) ? n : 0
}

/** CNPJ válido (14 dígitos) derivado do nome — uso interno, sem pedir documento ao usuário. */
export function generateProvisionalCnpj(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) >>> 0
  }
  const eight = String(hash % 100_000_000).padStart(8, "0")
  const base = `${eight}0001`

  const digit = (nums: string, weights: number[]) => {
    let sum = 0
    for (let i = 0; i < weights.length; i++) {
      sum += Number(nums[i]) * weights[i]
    }
    const rem = sum % 11
    return rem < 2 ? 0 : 11 - rem
  }

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const d1 = digit(base, w1)
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const d2 = digit(`${base}${d1}`, w2)
  return `${base}${d1}${d2}`
}
