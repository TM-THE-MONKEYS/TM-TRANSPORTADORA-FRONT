import type { CancelReason, DelayReason } from "@/types"

export const CANCEL_REASON_OPTIONS: { value: CancelReason; label: string }[] = [
  { value: "cliente_desistiu", label: "Cliente desistiu" },
  { value: "carga_indisponivel", label: "Carga indisponível" },
  { value: "problema_veiculo", label: "Problema no veículo" },
  { value: "problema_motorista", label: "Problema com motorista" },
  { value: "clima", label: "Clima" },
  { value: "preco", label: "Preço" },
  { value: "outros", label: "Outros" },
]

export const DELAY_REASON_OPTIONS: { value: DelayReason; label: string }[] = [
  { value: "transito", label: "Trânsito" },
  { value: "clima", label: "Clima" },
  { value: "fila_cliente", label: "Fila no cliente" },
  { value: "avaria", label: "Avaria" },
  { value: "documentacao", label: "Documentação" },
  { value: "outros", label: "Outros" },
]
