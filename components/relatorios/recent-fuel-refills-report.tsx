"use client"

import Link from "next/link"
import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"
import { listAllFuelRefills } from "@/lib/api/services/fuel"
import { formatBRL } from "@/lib/format/currency"
import { formatDateTimeBR } from "@/lib/format/dates"
import { useOperationContext } from "@/hooks/use-operation-context"

const LIMIT = 25

export function RecentFuelRefillsReport() {
  const { freights } = useOperationContext()
  const freightMap = new Map(freights.map((f) => [f.id, f]))

  const { data: refills, isLoading } = useSWR("reports-fuel-refills", () =>
    listAllFuelRefills(1, 100),
  )

  const items = (refills ?? []).slice(0, LIMIT)

  return (
    <div className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">Abastecimentos recentes</h2>
        <p className="text-sm text-muted-foreground">
          Vinculados aos fretes — também visíveis no detalhe de cada frete
        </p>
      </div>
      {isLoading ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Frete</th>
              <th className="px-4 py-3 text-left">Posto / obs.</th>
              <th className="px-4 py-3 text-right">Litros</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-left">Data</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                  Nenhum abastecimento registrado
                </td>
              </tr>
            ) : (
              items.map((r) => {
                const freight = freightMap.get(r.freight_id)
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/fretes/${r.freight_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {freight?.code ?? r.freight_code ?? r.freight_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.posto ?? r.cidade ?? "Abastecimento"}
                      {r.posto && r.cidade ? ` · ${r.cidade}` : ""}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.litros.toLocaleString("pt-BR")} L
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatBRL(r.valor_total)}
                    </td>
                    <td className="px-4 py-3">{formatDateTimeBR(r.created_at)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
