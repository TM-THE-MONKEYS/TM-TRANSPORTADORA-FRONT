"use client"

import Link from "next/link"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getTollSummaryByFreight, listTollsByFreight } from "@/lib/api/services/tolls"
import { formatBRL } from "@/lib/format/currency"

function formatDateBR(dateStr?: string) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("pt-BR")
}

export function TollFreightTab({ freightId }: { freightId: string }) {
  const { data: summary, isLoading: loadingSummary } = useSWR(
    freightId ? ["toll-summary", freightId] : null,
    () => getTollSummaryByFreight(freightId),
  )

  const { data: tollsPage, isLoading: loadingTolls } = useSWR(
    freightId ? ["toll-freight", freightId] : null,
    () => listTollsByFreight(freightId, 1, 50),
  )

  const tolls = tollsPage?.items ?? []

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Resumo de pedágios</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSummary ? (
            <Skeleton className="h-12 w-full" />
          ) : summary && summary.chargesCount > 0 ? (
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Total pago</p>
                <p className="text-xl font-semibold">{formatBRL(summary.totalValor)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total de praças</p>
                <p className="text-xl font-semibold">{summary.totalQuantidade}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Registros</p>
                <p className="text-xl font-semibold">{summary.chargesCount}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum pedágio registrado neste frete.
            </p>
          )}
        </CardContent>
      </Card>

      {loadingTolls ? (
        <Skeleton className="h-24 w-full" />
      ) : tolls.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {tolls.map((toll) => {
            const descParts: string[] = []
            if (toll.rodovia) descParts.push(toll.rodovia)
            if (toll.cidade)
              descParts.push(toll.estado ? `${toll.cidade}/${toll.estado}` : toll.cidade)

            return (
              <li
                key={toll.id}
                className="flex items-start justify-between gap-2 rounded-md border px-3 py-2"
              >
                <div>
                  <p className="font-medium">
                    {toll.praca
                      ? toll.praca
                      : `Pedágio — ${toll.quantidade}x praça${toll.quantidade > 1 ? "s" : ""}`}
                    {toll.praca && toll.quantidade > 1 ? ` (${toll.quantidade}x)` : ""}
                  </p>
                  {descParts.length > 0 && (
                    <p className="text-xs text-muted-foreground">{descParts.join(" · ")}</p>
                  )}
                  {toll.observacoes && (
                    <p className="text-xs text-muted-foreground">{toll.observacoes}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDateBR(toll.data_pedagio)}
                    {toll.driver_name ? ` · ${toll.driver_name}` : ""}
                  </p>
                </div>
                <span className="shrink-0 font-medium text-destructive">
                  −{formatBRL(toll.valor)}
                </span>
              </li>
            )
          })}
        </ul>
      ) : null}

      <Link
        href="/dashboard/pedagios"
        className="mt-2 inline-block text-sm text-primary hover:underline"
      >
        Registrar pedágio →
      </Link>
    </div>
  )
}
