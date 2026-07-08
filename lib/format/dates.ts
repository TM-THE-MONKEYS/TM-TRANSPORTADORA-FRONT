import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/** Parse ISO or YYYY-MM-DD as local calendar date (no UTC day shift). */
export function parseLocalDate(iso: string): Date {
  if (DATE_ONLY.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number)
    return new Date(y, m - 1, d)
  }
  return parseISO(iso)
}

export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return format(parseLocalDate(iso), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return iso
  }
}

export function formatDateTimeBR(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    if (DATE_ONLY.test(iso)) {
      return format(parseLocalDate(iso), "dd/MM/yyyy", { locale: ptBR })
    }
    return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: ptBR })
  } catch {
    return iso
  }
}

/** HTML date input → API (date-only, no timezone). */
export function dateInputToApi(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  return value.slice(0, 10)
}

/** API ISO → HTML date input value. */
export function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return ""
  if (DATE_ONLY.test(iso)) return iso
  try {
    const d = parseISO(iso)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  } catch {
    return iso.slice(0, 10)
  }
}

export function currentCompetencia(): { mes: number; ano: number } {
  const now = new Date()
  return { mes: now.getMonth() + 1, ano: now.getFullYear() }
}

export function shiftCompetencia(
  mes: number,
  ano: number,
  delta: number,
): { mes: number; ano: number } {
  const d = new Date(ano, mes - 1 + delta, 1)
  return { mes: d.getMonth() + 1, ano: d.getFullYear() }
}

export function formatCompetenciaLabel(mes: number, ano: number): string {
  const d = new Date(ano, mes - 1, 1)
  return format(d, "MMMM yyyy", { locale: ptBR })
}

export function isFixedExpenseEntry(observacoes?: string | null): boolean {
  return Boolean(observacoes?.startsWith("fixed_expense:"))
}
