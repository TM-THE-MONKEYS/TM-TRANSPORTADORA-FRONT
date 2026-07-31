/** Origem do lançamento a partir da chave em `observacoes`. */

export type FinanceEntryOrigin =
  | "manual"
  | "frete"
  | "combustivel"
  | "pedagio"
  | "comissao"
  | "fixo"
  | "custo_frete"

const ORIGIN_LABELS: Record<FinanceEntryOrigin, string> = {
  manual: "Manual",
  frete: "Frete",
  combustivel: "Combustível",
  pedagio: "Pedágio",
  comissao: "Comissão",
  fixo: "Fixo",
  custo_frete: "Viagem",
}

export function resolveFinanceEntryOrigin(observacoes?: string | null): FinanceEntryOrigin {
  if (!observacoes) return "manual"
  if (observacoes.startsWith("freight_revenue:")) return "frete"
  if (observacoes.startsWith("fuel_refill:")) return "combustivel"
  if (observacoes.startsWith("toll_charge:")) return "pedagio"
  if (observacoes.startsWith("commission:")) return "comissao"
  if (observacoes.startsWith("fixed_expense:")) return "fixo"
  if (observacoes.startsWith("freight_cost:")) return "custo_frete"
  return "manual"
}

export function financeEntryOriginLabel(origin: FinanceEntryOrigin): string {
  return ORIGIN_LABELS[origin]
}
