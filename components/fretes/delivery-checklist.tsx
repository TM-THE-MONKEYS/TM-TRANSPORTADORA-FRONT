"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
          Ainda não é salvo no servidor — use ocorrências/anexos do frete para registrar a entrega
          por enquanto.
        </p>
      </CardContent>
    </Card>
  )
}
