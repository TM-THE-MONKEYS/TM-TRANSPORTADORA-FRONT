"use client"

import Link from "next/link"
import { AlertTriangle, ShieldAlert } from "lucide-react"
import { FreightAddCostForm } from "@/components/fretes/freight-add-cost-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FREIGHT_STATUS_LABELS } from "@/lib/freight/status"
import { SEMANTIC } from "@/lib/ui/status-colors"
import { cn } from "@/lib/utils"
import type { FreightOrder } from "@/types"

type FreightClosedAdminPanelProps = {
  freight: FreightOrder
  onUpdated?: () => void
}

export function FreightClosedAdminPanel({ freight, onUpdated }: FreightClosedAdminPanelProps) {
  return (
    <Card className={cn("mb-6", SEMANTIC.cautionSurface)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className={cn("h-4 w-4", SEMANTIC.cautionText)} />
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

        <div
          className={cn(
            "flex items-start gap-2 rounded-md border bg-background/60 px-3 py-2 text-xs text-muted-foreground",
            SEMANTIC.cautionBorder,
          )}
        >
          <AlertTriangle className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", SEMANTIC.cautionText)} />
          Ocorrências retroativas: use a aba <strong>Ocorrências</strong> abaixo — permanece
          disponível para admin mesmo com frete encerrado.
        </div>
      </CardContent>
    </Card>
  )
}
