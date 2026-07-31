export const FREIGHT_COST_TYPES = [
  { value: "combustivel", label: "Combustível" },
  { value: "pedagio",     label: "Pedágio" },
  { value: "manutencao",  label: "Manutenção" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "outro",       label: "Outro" },
] as const

/** Tipos selecionáveis no form de gasto do frete (combustível vai pela tela Abastecimento). */
export const MANUAL_FREIGHT_COST_TYPES = FREIGHT_COST_TYPES.filter(
  (t) => t.value !== "combustivel",
)

export type FreightCostType = (typeof FREIGHT_COST_TYPES)[number]["value"]

const COST_TYPE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  FREIGHT_COST_TYPES.map((t) => [t.value.toLowerCase(), t.label]),
)

/**
 * Returns the display label for a cost type value.
 * Case-insensitive; falls back to the raw value if unknown.
 */
export function freightCostTypeLabel(tipo: string): string {
  return COST_TYPE_LABEL_MAP[tipo.toLowerCase()] ?? tipo
}
