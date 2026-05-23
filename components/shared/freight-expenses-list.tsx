"use client"

import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"
import { getFreightCosts } from "@/lib/api/services/freight"
import { formatBRL } from "@/lib/format/currency"
import { formatDateTimeBR } from "@/lib/format/dates"

type FreightExpensesListProps = {
  freightId: string
  emptyMessage?: string
}

export function FreightExpensesList({
  freightId,
  emptyMessage = "Nenhum custo ou abastecimento registrado.",
}: FreightExpensesListProps) {
  const { data: costs, isLoading } = useSWR(
    freightId ? ["freight-expenses", freightId] : null,
    () => getFreightCosts(freightId),
  )

  if (isLoading) return <Skeleton className="h-24 w-full" />

  if (!costs?.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <ul className="space-y-2 text-sm">
      {costs.map((c) => (
        <li
          key={c.id}
          className="flex items-start justify-between gap-2 rounded-md border px-3 py-2"
        >
          <div>
            <p className="font-medium capitalize">
              {c.tipo === "combustivel" ? "Abastecimento" : c.tipo}
            </p>
            {c.descricao && <p className="text-muted-foreground">{c.descricao}</p>}
            {c.litros != null && (
              <p className="text-xs text-muted-foreground">
                {c.litros.toLocaleString("pt-BR")} L
              </p>
            )}
            <p className="text-xs text-muted-foreground">{formatDateTimeBR(c.created_at)}</p>
          </div>
          <span className="shrink-0 font-medium text-destructive">−{formatBRL(c.valor)}</span>
        </li>
      ))}
    </ul>
  )
}
