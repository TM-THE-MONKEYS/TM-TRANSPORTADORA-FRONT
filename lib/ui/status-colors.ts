/**
 * Mapeamento único de tom semântico por status operacional.
 * Use estas classes/tokens em badges, dots, barras e gráficos —
 * nunca hardcode violet/emerald/rose/amber etc. nos componentes.
 */
import type {
  DriverStatus,
  FinanceEntryStatus,
  FreightStatus,
  MaintenanceStatus,
  TruckStatus,
} from "@/types"

export type StatusTone =
  | "neutral"
  | "info"
  | "warning"
  | "progress"
  | "success"
  | "danger"
  | "caution"

type ToneClasses = {
  /** Fundo sólido (dot, barra de accent) */
  bg: string
  /** Texto */
  text: string
  /** Badge/pill suave */
  soft: string
  /** Valor CSS para Recharts / fill inline */
  chart: string
}

export const STATUS_TONE: Record<StatusTone, ToneClasses> = {
  neutral: {
    bg: "bg-status-neutral",
    text: "text-status-neutral",
    soft: "bg-status-neutral/15 text-status-neutral",
    chart: "var(--color-status-neutral)",
  },
  info: {
    bg: "bg-status-info",
    text: "text-status-info",
    soft: "bg-status-info/15 text-status-info",
    chart: "var(--color-status-info)",
  },
  warning: {
    bg: "bg-status-warning",
    text: "text-status-warning",
    soft: "bg-status-warning/15 text-status-warning",
    chart: "var(--color-status-warning)",
  },
  progress: {
    bg: "bg-status-progress",
    text: "text-status-progress",
    soft: "bg-status-progress/15 text-status-progress",
    chart: "var(--color-status-progress)",
  },
  success: {
    bg: "bg-status-success",
    text: "text-status-success",
    soft: "bg-status-success/15 text-status-success",
    chart: "var(--color-status-success)",
  },
  danger: {
    bg: "bg-status-danger",
    text: "text-status-danger",
    soft: "bg-status-danger/15 text-status-danger",
    chart: "var(--color-status-danger)",
  },
  caution: {
    bg: "bg-status-caution",
    text: "text-status-caution",
    soft: "bg-status-caution/15 text-status-caution",
    chart: "var(--color-status-caution)",
  },
}

/** Valores financeiros / KPI: positivo vs negativo */
export const SEMANTIC = {
  positive: "text-status-success",
  positiveIcon: "text-status-success",
  negative: "text-destructive",
  overdue: "text-status-danger",
  overdueBorder: "border-status-danger/50",
  cautionBorder: "border-status-caution/50",
  cautionSurface: "border-status-caution/40 bg-status-caution/5",
  cautionText: "text-status-caution",
  warningSurface: "border-status-warning/40 bg-status-warning/5",
  warningText: "text-status-warning",
  progressSurface: "border-status-progress/40 bg-status-progress/5",
  progressText: "text-status-progress",
} as const

export const FREIGHT_STATUS_TONE: Record<FreightStatus, StatusTone> = {
  orcamento: "neutral",
  confirmado: "info",
  em_coleta: "warning",
  em_transporte: "progress",
  entregue: "success",
  cancelado: "danger",
}

export const TRUCK_STATUS_TONE: Record<TruckStatus, StatusTone> = {
  disponivel: "success",
  em_viagem: "progress",
  em_manutencao: "warning",
  inativo: "neutral",
}

export const DRIVER_STATUS_TONE: Record<DriverStatus, StatusTone> = {
  ativo: "success",
  inativo: "neutral",
  suspenso: "danger",
  ferias: "info",
}

export const FINANCE_STATUS_TONE: Record<FinanceEntryStatus, StatusTone> = {
  pendente: "warning",
  pago: "success",
  cancelado: "danger",
  vencido: "danger",
}

export const MAINTENANCE_STATUS_TONE: Record<MaintenanceStatus, StatusTone> = {
  agendada: "info",
  em_andamento: "progress",
  concluida: "success",
  cancelada: "danger",
}

/** Status de tracking/ocorrência na timeline do frete */
export const TRACKING_STATUS_TONE: Record<string, StatusTone> = {
  coletado: "info",
  em_transito: "progress",
  saiu_para_entrega: "progress",
  tentativa_entrega: "warning",
  entregue: "success",
  devolvido: "danger",
}

export function statusDotClass(tone: StatusTone): string {
  return STATUS_TONE[tone].bg
}

export function statusAccentClass(tone: StatusTone): string {
  return STATUS_TONE[tone].bg
}

export function statusSoftClass(tone: StatusTone): string {
  return STATUS_TONE[tone].soft
}

export function statusTextClass(tone: StatusTone): string {
  return STATUS_TONE[tone].text
}

export function statusChartColor(tone: StatusTone): string {
  return STATUS_TONE[tone].chart
}

export function freightStatusDot(status: FreightStatus): string {
  return statusDotClass(FREIGHT_STATUS_TONE[status])
}

export function freightStatusAccent(status: FreightStatus): string {
  return statusAccentClass(FREIGHT_STATUS_TONE[status])
}

export function freightStatusSoft(status: FreightStatus): string {
  return statusSoftClass(FREIGHT_STATUS_TONE[status])
}

export function freightStatusChart(status: FreightStatus): string {
  return statusChartColor(FREIGHT_STATUS_TONE[status])
}
