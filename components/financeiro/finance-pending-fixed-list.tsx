"use client"

import { useState } from "react"
import { CalendarClock, CheckCircle2, Loader2, Rocket } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatBRL } from "@/lib/format/currency"
import { formatDateBR } from "@/lib/format/dates"
import type { FixedExpenseLaunchStatus } from "@/types"

interface FinancePendingFixedListProps {
  items: FixedExpenseLaunchStatus[]
  loading?: boolean
  launching?: boolean
  onLaunchOne: (id: string, vencimento?: string) => Promise<void>
  onLaunchAll: () => Promise<void>
}

export function FinancePendingFixedList({
  items,
  loading,
  launching,
  onLaunchOne,
  onLaunchAll,
}: FinancePendingFixedListProps) {
  const pending = items.filter((i) => !i.launched_this_month)
  const launched = items.filter((i) => i.launched_this_month)
  const [dates, setDates] = useState<Record<string, string>>({})
  const [launchingId, setLaunchingId] = useState<string | null>(null)

  async function handleLaunchOne(item: FixedExpenseLaunchStatus) {
    setLaunchingId(item.id)
    try {
      const venc =
        dates[item.id] ??
        item.suggested_vencimento?.slice(0, 10) ??
        undefined
      await onLaunchOne(item.id, venc)
    } finally {
      setLaunchingId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">A lançar neste mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <Card className="border-amber-200/60 dark:border-amber-900/40">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-amber-600" />
              A lançar neste mês
            </CardTitle>
            <CardDescription>
              {pending.length} pendente(s) · {launched.length} já lançado(s)
            </CardDescription>
          </div>
          {pending.length > 0 && (
            <Button size="sm" disabled={launching} onClick={onLaunchAll}>
              {launching ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="mr-1.5 h-4 w-4" />
              )}
              Lançar todos ({pending.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todos os gastos fixos ativos já foram lançados nesta competência.
          </p>
        ) : (
          pending.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {item.categoria} · {formatBRL(item.valor)}
                </p>
              </div>
              <Input
                type="date"
                className="h-8 w-[140px] text-xs"
                value={
                  dates[item.id] ??
                  item.suggested_vencimento?.slice(0, 10) ??
                  ""
                }
                onChange={(e) =>
                  setDates((d) => ({ ...d, [item.id]: e.target.value }))
                }
              />
              <Button
                size="sm"
                variant="outline"
                disabled={launchingId === item.id || launching}
                onClick={() => handleLaunchOne(item)}
              >
                {launchingId === item.id ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : null}
                Lançar
              </Button>
            </div>
          ))
        )}

        {launched.length > 0 && (
          <div className="pt-2">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Já lançados
            </p>
            <div className="flex flex-wrap gap-2">
              {launched.map((item) => (
                <Badge key={item.id} variant="secondary" className="gap-1 font-normal">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  {item.nome}
                  {item.suggested_vencimento && (
                    <span className="text-muted-foreground">
                      · venc. {formatDateBR(item.suggested_vencimento)}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
