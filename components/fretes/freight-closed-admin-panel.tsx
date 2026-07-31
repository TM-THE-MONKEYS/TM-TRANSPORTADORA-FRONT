"use client"

import Link from "next/link"
import { AlertTriangle, ShieldAlert } from "lucide-react"
import { FreightAddCostForm } from "@/components/fretes/freight-add-cost-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FREIGHT_STATUS_LABELS } from "@/lib/freight/status"
import type { FreightOrder } from "@/types"

type FreightClosedAdminPanelProps = {
  freight: FreightOrder
  onUpdated?: () => void
}

export function FreightClosedAdminPanel({ freight, onUpdated }: FreightClosedAdminPanelProps) {
  return (
    <Card className="mb-6 border-amber-300/60 bg-amber-50/40 dark:border-amber-800/50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          Administração — frete encerrado
        </CardTitle>
        <CardDescription>
          Este frete está <strong>{FREIGHT_STATUS_LABELS[freight.status]}</strong>. Como
          administrador, você pode alterar o status no topo da página, lançar gastos retroativos
          abaixo ou registrar ocorrências na aba correspondente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <section className="space-y-3">
          <p className="text-sm font-medium">Lançar gasto de viagem</p>
          <FreightAddCostForm freightId={freight.id} compact onAdded={onUpdated} />
          <p className="text-xs text-muted-foreground">
            Para abastecimento com litros e km, use{" "}
            <Link
              href={`/dashboard/abastecimento?freightId=${freight.id}&allowClosed=1`}
              className="text-primary underline"
            >
              abastecimento retroativo
            </Link>
            .
          </p>
        </section>

        <div className="flex items-start gap-2 rounded-md border border-amber-200/80 bg-background/60 px-3 py-2 text-xs text-muted-foreground dark:border-amber-900/50">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          Ocorrências retroativas: use a aba <strong>Ocorrências</strong> abaixo — permanece
          disponível para admin mesmo com frete encerrado.
        </div>
      </CardContent>
    </Card>
  )
}
