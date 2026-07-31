"use client"

import { useState } from "react"
import Link from "next/link"
import { mutate } from "swr"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { addFreightCost } from "@/lib/api/services/freight"
import { formatMoneyInput, parseMoneyInput } from "@/lib/format/numbers"
import { MANUAL_FREIGHT_COST_TYPES } from "@/lib/freight/costs"

type FreightAddCostFormProps = {
  freightId: string
  onAdded?: () => void
  compact?: boolean
}

export function FreightAddCostForm({ freightId, onAdded, compact }: FreightAddCostFormProps) {
  const [tipo, setTipo] = useState<string>("pedagio")
  const [valorDisplay, setValorDisplay] = useState("")
  const [descricao, setDescricao] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valor = parseMoneyInput(valorDisplay)
    if (valor == null || valor <= 0) {
      toast.error("Informe um valor válido")
      return
    }

    setSaving(true)
    try {
      await addFreightCost(freightId, {
        tipo,
        valor,
        descricao: descricao.trim() || undefined,
      })

      void mutate(["freight-expenses", freightId])
      void mutate(["freight-breakdown-costs", freightId])
      void mutate(["freight-breakdown-finance", freightId])
      void mutate(["freight-breakdown", freightId])
      void mutate(
        (key) => Array.isArray(key) && key[0] === "cash-flow",
        undefined,
        { revalidate: true },
      )
      void mutate(
        (key) => Array.isArray(key) && key[0] === "finance-entries",
        undefined,
        { revalidate: true },
      )

      setValorDisplay("")
      setDescricao("")
      toast.success("Gasto registrado no frete e no financeiro")
      onAdded?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar gasto")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      <p className="text-xs text-muted-foreground">
        Combustível: use{" "}
        <Link
          href={`/dashboard/abastecimento?freightId=${freightId}`}
          className="text-primary underline"
        >
          Abastecimento
        </Link>{" "}
        (evita duplicar no financeiro).
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo de gasto</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MANUAL_FREIGHT_COST_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor (R$)</Label>
          <Input
            inputMode="decimal"
            placeholder="0,00"
            value={valorDisplay}
            onChange={(e) => setValorDisplay(formatMoneyInput(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição (opcional)</Label>
        <Textarea
          rows={compact ? 2 : 3}
          placeholder="Ex.: pedágio retorno, nota fiscal..."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Salvando..." : "Registrar gasto"}
      </Button>
    </form>
  )
}
