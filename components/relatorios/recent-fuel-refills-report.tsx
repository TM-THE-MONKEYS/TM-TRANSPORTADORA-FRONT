"use client"

import { useMemo } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Droplets, Fuel, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { listAllFuelRefills } from "@/lib/api/services/fuel"
import { formatBRL } from "@/lib/format/currency"
import { formatDateBR } from "@/lib/format/dates"
import { useOperationContext } from "@/hooks/use-operation-context"
import { cn } from "@/lib/utils"

const LIMIT = 25

export function RecentFuelRefillsReport() {
  const { freights } = useOperationContext()
  const freightMap = useMemo(() => new Map(freights.map((f) => [f.id, f])), [freights])

  const { data: refills, isLoading } = useSWR("reports-fuel-refills", () =>
    listAllFuelRefills(1, 100),
  )

  const items = (refills ?? []).slice(0, LIMIT)

  const totalLitros = useMemo(() => items.reduce((s, r) => s + r.litros, 0), [items])
  const totalValor = useMemo(() => items.reduce((s, r) => s + r.valor_total, 0), [items])
  const avgPricePer100L = useMemo(
    () => (totalLitros > 0 ? (totalValor / totalLitros) : 0),
    [totalLitros, totalValor],
  )

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatChip
            icon={Droplets}
            label="Total abastecido"
            value={`${totalLitros.toLocaleString("pt-BR")} L`}
            tone="primary"
          />
          <StatChip
            icon={TrendingDown}
            label="Custo total"
            value={formatBRL(totalValor)}
            tone="danger"
          />
          <StatChip
            icon={Fuel}
            label="Preço médio/litro"
            value={formatBRL(avgPricePer100L)}
          />
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Abastecimentos recentes</CardTitle>
          <CardDescription>
            Vinculados aos fretes — também visíveis no detalhe de cada frete
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Frete</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Posto / Local</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Litros</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">R$/L</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                        Nenhum abastecimento registrado
                      </td>
                    </tr>
                  ) : (
                    items.map((r) => {
                      const freight = freightMap.get(r.freight_id)
                      const pricePerLiter = r.litros > 0 ? r.valor_total / r.litros : 0
                      return (
                        <tr
                          key={r.id}
                          className="border-b transition-colors last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/dashboard/fretes/${r.freight_id}`}
                              className="font-semibold text-primary hover:underline"
                            >
                              {freight?.code ?? r.freight_code ?? r.freight_id.slice(0, 8)}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {r.posto
                              ? r.cidade
                                ? `${r.posto} · ${r.cidade}`
                                : r.posto
                              : r.cidade ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {r.litros.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} L
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums text-destructive">
                            {formatBRL(r.valor_total)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                            {pricePerLiter > 0 ? formatBRL(pricePerLiter) : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {formatDateBR(r.created_at)}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatChip({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ElementType
  label: string
  value: string
  tone?: "default" | "primary" | "danger"
}) {
  const iconCn = {
    default: "text-muted-foreground",
    primary: "text-primary",
    danger:  "text-destructive",
  }[tone]

  const valueCn = {
    default: "",
    primary: "text-primary",
    danger:  "text-destructive",
  }[tone]

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className={cn("h-4 w-4", iconCn)} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-base font-bold tabular-nums", valueCn)}>{value}</p>
      </div>
    </div>
  )
}
