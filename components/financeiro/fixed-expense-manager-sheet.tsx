"use client"

import { Building2, CalendarClock, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  FREQUENCY_LABELS,
  fixedExpenseEndDate,
  fixedExpenseRemainingParcelas,
  isFixedExpenseActive,
  monthlyEquivalent,
} from "@/lib/api/services/fixed-expenses"
import { formatBRL } from "@/lib/format/currency"
import { formatDateBR } from "@/lib/format/dates"
import { cn } from "@/lib/utils"
import type { FixedExpense } from "@/types"

function formatDate(d?: string | Date) {
  if (!d) return "—"
  if (d instanceof Date) return formatDateBR(d.toISOString())
  return formatDateBR(d)
}

interface FixedExpenseManagerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: FixedExpense[]
  onCreate: () => void
  onEdit: (item: FixedExpense) => void
  onDelete: (id: string) => void
  onLaunch: (item: FixedExpense) => void
}

export function FixedExpenseManagerSheet({
  open,
  onOpenChange,
  items,
  onCreate,
  onEdit,
  onDelete,
  onLaunch,
}: FixedExpenseManagerSheetProps) {
  const activeCount = items.filter((f) => isFixedExpenseActive(f)).length
  const monthlyTotal = items
    .filter((f) => isFixedExpenseActive(f))
    .reduce((s, f) => s + monthlyEquivalent(f), 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <div className="space-y-1 pr-8">
          <h2 className="text-lg font-semibold">Gastos fixos</h2>
          <p className="text-sm text-muted-foreground">
            Cadastro de templates recorrentes. Lançamentos são feitos no hub da competência.
          </p>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">
                Total mensal:{" "}
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formatBRL(monthlyTotal)}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {activeCount} ativo(s) de {items.length} cadastrado(s)
              </p>
            </div>
            <Button size="sm" onClick={onCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Novo
            </Button>
          </div>

          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">Nenhum gasto fixo cadastrado.</p>
              </div>
            ) : (
              items.map((item) => (
                <FixedExpenseCard
                  key={item.id}
                  item={item}
                  onEdit={() => onEdit(item)}
                  onDelete={() => onDelete(item.id)}
                  onLaunch={() => onLaunch(item)}
                />
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function FixedExpenseCard({
  item,
  onEdit,
  onDelete,
  onLaunch,
}: {
  item: FixedExpense
  onEdit: () => void
  onDelete: () => void
  onLaunch: () => void
}) {
  const active = isFixedExpenseActive(item)
  const remaining = fixedExpenseRemainingParcelas(item)
  const endDate = fixedExpenseEndDate(item)

  return (
    <Card className={cn("transition-all", !active && "opacity-60")}>
      <CardContent className="pt-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {active && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" title="Ativo" />
              )}
              <p className="truncate font-semibold">{item.nome}</p>
              {!active && (
                <Badge variant="outline" className="shrink-0 text-xs">
                  {item.total_parcelas ? "Encerrado" : "Inativo"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{item.categoria}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mb-3 space-y-1">
          <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {formatBRL(item.valor)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3" />
            {FREQUENCY_LABELS[item.frequencia]}
            {item.dia_vencimento ? ` · todo dia ${item.dia_vencimento}` : ""}
          </div>
          {item.frequencia !== "mensal" && (
            <p className="text-xs text-muted-foreground">
              ≈ {formatBRL(monthlyEquivalent(item))}/mês
            </p>
          )}
          {item.total_parcelas ? (
            <p className="text-xs text-muted-foreground">
              {item.parcelas_lancadas ?? 0}/{item.total_parcelas} parcela(s)
              {remaining !== null && remaining > 0 ? ` · ${remaining} restante(s)` : ""}
              {endDate ? ` · até ${formatDate(endDate)}` : ""}
            </p>
          ) : null}
        </div>

        {item.observacao && (
          <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{item.observacao}</p>
        )}

        {active && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={onLaunch}
            disabled={remaining === 0}
          >
            <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
            Lançar como despesa
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
