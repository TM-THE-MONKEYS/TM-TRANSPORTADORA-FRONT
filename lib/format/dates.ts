import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return iso
  }
}

export function formatDateTimeBR(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: ptBR })
  } catch {
    return iso
  }
}
