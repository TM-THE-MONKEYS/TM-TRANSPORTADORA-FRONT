"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SEMANTIC } from "@/lib/ui/status-colors"
import { cn } from "@/lib/utils"

/**
 * Checklist de entrega ainda sem API de persistência.
 * Não oferece checkboxes interativos para evitar a impressão de que o
 * registro foi salvo no servidor.
 */
export function DeliveryChecklist({ freightId: _freightId }: { freightId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist de entrega</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Em breve: carga conferida, lacre/documentação, fotos e assinatura do recebedor.
        </p>
        <p className={cn("text-xs font-medium", SEMANTIC.cautionText)}>
          Ainda não é salvo no servidor — use ocorrências/anexos do frete para registrar a entrega
          por enquanto.
        </p>
      </CardContent>
    </Card>
  )
}
