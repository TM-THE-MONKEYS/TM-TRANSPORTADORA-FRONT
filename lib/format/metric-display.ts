import { formatBRL } from "@/lib/format/currency"

export type MetricDisplayParse =
  | { kind: "static" }
  | {
      kind: "animate"
      target: number
      format: (n: number) => string
    }

/**
 * Detecta se o texto do KPI pode contar (inteiro ou BRL, com sufixo opcional).
 * Ex.: "3", "R$ 284.500,00", "R$ 86.300,00 (30,3%)".
 */
export function parseMetricDisplay(value: string): MetricDisplayParse {
  const trimmed = value.trim()

  if (/^-?\d+$/.test(trimmed)) {
    const target = Number(trimmed)
    return {
      kind: "animate",
      target,
      format: (n) => String(Math.round(n)),
    }
  }

  const brl = trimmed.match(/^(R\$\s*)(-?[\d.]+,\d{2})(.*)$/)
  if (brl) {
    const raw = brl[2].replace(/\./g, "").replace(",", ".")
    const target = Number(raw)
    if (!Number.isFinite(target)) return { kind: "static" }
    const suffix = brl[3] ?? ""
    return {
      kind: "animate",
      target,
      format: (n) => `${formatBRL(n)}${suffix}`,
    }
  }

  return { kind: "static" }
}
