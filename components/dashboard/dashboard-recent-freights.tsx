"use client"

import Link from "next/link"
import { ArrowRight, Package } from "lucide-react"
import { FreightStatusBadge } from "@/components/fretes/freight-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useOperationContext } from "@/hooks/use-operation-context"
import { formatBRL } from "@/lib/format/currency"
import { formatDateTimeBR } from "@/lib/format/dates"
import { sortFreightsByRecent } from "@/lib/freight/report-metrics"

/** Reusa a chave SWR `op-freights` (ListFilterBar no dashboard) — sem segundo listFreights. */
export function DashboardRecentFreights() {
  const { freights, isLoading } = useOperationContext({
    freights: true,
    drivers: false,
    trucks: false,
  })
  const recent = sortFreightsByRecent(freights).slice(0, 8)

  return (
    <Card variant="glass-subtle" size="sm" className="flex h-full min-h-[18rem] min-w-0 flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div>
          <CardTitle className="tracking-tight">Fretes recentes</CardTitle>
          <CardDescription>Últimas movimentações na operação</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground" asChild>
          <Link href="/dashboard/fretes">
            Ver todos
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto p-0">
        {isLoading ? (
          <div className="space-y-2 px-4 pb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full bg-foreground/10" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
            <Package className="h-8 w-8 opacity-40" />
            <p>Nenhum frete cadastrado</p>
            <Button size="sm" asChild>
              <Link href="/dashboard/fretes/novo">Criar primeiro frete</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-foreground/10">
            {recent.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/dashboard/fretes/${f.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{f.code}</span>
                      <FreightStatusBadge status={f.status} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {f.origin_city} → {f.destination_city}
                      {f.customer_name ? ` · ${f.customer_name}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Atualizado {formatDateTimeBR(f.updated_at)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium">{formatBRL(f.value_brl)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
