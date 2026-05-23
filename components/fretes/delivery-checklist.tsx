"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

const items = [
  { id: "carga_ok", label: "Carga conferida" },
  { id: "lacre_ok", label: "Lacre / documentação" },
  { id: "fotos_ok", label: "Fotos da entrega" },
  { id: "assinatura_ok", label: "Assinatura do recebedor" },
]

export function DeliveryChecklist({ freightId }: { freightId: string }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist de entrega</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <Checkbox
              id={`${freightId}-${item.id}`}
              checked={!!checked[item.id]}
              onCheckedChange={(v) =>
                setChecked((c) => ({ ...c, [item.id]: v === true }))
              }
            />
            <Label htmlFor={`${freightId}-${item.id}`}>{item.label}</Label>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Persistência via checklist de entrega (fase 2 — ver API-FRONTEND.md)
        </p>
      </CardContent>
    </Card>
  )
}
