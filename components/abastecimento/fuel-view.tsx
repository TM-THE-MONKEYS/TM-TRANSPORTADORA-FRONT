"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
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
import { PageHeader } from "@/components/shared/page-header"
import { listFreights } from "@/lib/api/services/freight"
import {
  fuelRefillToCostRow,
  listAllFuelRefills,
  registerFuelRefill,
} from "@/lib/api/services/fuel"
import {
  formatLitersInput,
  formatMoneyInput,
  parseLitersInput,
  parseMoneyInput,
} from "@/lib/format/numbers"
import { formatBRL } from "@/lib/format/currency"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"

function formatDate(dateStr?: string) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("pt-BR")
}

export function FuelView() {
  const canWrite = usePermission(PERMISSIONS.freightWrite)
  const [freightId, setFreightId] = useState("")
  const [valorDisplay, setValorDisplay] = useState("")
  const [litrosDisplay, setLitrosDisplay] = useState("")
  const [posto, setPosto] = useState("")
  const [saving, setSaving] = useState(false)

  const { data: freightsPage } = useSWR("fuel-freights", () => listFreights(1, 100))
  const { data: refills, mutate: refreshRefills } = useSWR("fuel-refills-all", () =>
    listAllFuelRefills(1, 200),
  )

  const freights = freightsPage?.items ?? []
  const freightMap = useMemo(() => new Map(freights.map((f) => [f.id, f])), [freights])
  const costRows = useMemo(() => (refills ?? []).map(fuelRefillToCostRow), [refills])

  const selectedFreight = freights.find((f) => f.id === freightId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valor_total = parseMoneyInput(valorDisplay)
    const litros = parseLitersInput(litrosDisplay)

    if (!freightId) {
      toast.error("Selecione a ordem de frete")
      return
    }
    if (valor_total <= 0) {
      toast.error("Informe o valor do abastecimento")
      return
    }
    if (litros <= 0) {
      toast.error("Informe os litros abastecidos")
      return
    }
    if (!selectedFreight?.driver_id) {
      toast.error("Vincule um motorista ao frete antes de registrar abastecimento")
      return
    }

    setSaving(true)
    try {
      await registerFuelRefill({
        freight_id: freightId,
        driver_id: selectedFreight.driver_id,
        litros,
        valor_total,
        posto: posto.trim() || undefined,
        observacoes: posto.trim() || undefined,
      })
      toast.success("Abastecimento registrado")
      setValorDisplay("")
      setLitrosDisplay("")
      setPosto("")
      await refreshRefills()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abastecimento"
        description="Registro via API /fuel — vincula frete, motorista e tm_fuel_refills"
      />

      {canWrite && (
        <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">Registrar abastecimento</h2>
          <div className="space-y-2">
            <Label>Ordem de frete</Label>
            <Select value={freightId} onValueChange={setFreightId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o frete" />
              </SelectTrigger>
              <SelectContent>
                {freights.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.code} — {f.origin_city} → {f.destination_city}
                    {!f.driver_id ? " (sem motorista)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFreight && !selectedFreight.driver_id && (
              <p className="text-xs text-destructive">
                Este frete não tem motorista. Vincule em{" "}
                <Link href={`/dashboard/fretes/${selectedFreight.id}`} className="underline">
                  detalhes do frete
                </Link>
                .
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fuel-valor">Valor (R$)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
                <Input
                  id="fuel-valor"
                  inputMode="numeric"
                  className="pl-9"
                  placeholder="0,00"
                  value={valorDisplay}
                  onChange={(e) => setValorDisplay(formatMoneyInput(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuel-litros">Litros</Label>
              <Input
                id="fuel-litros"
                inputMode="decimal"
                placeholder="Ex.: 350,5"
                value={litrosDisplay}
                onChange={(e) => setLitrosDisplay(formatLitersInput(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fuel-posto">Posto / observação</Label>
            <Input
              id="fuel-posto"
              placeholder="Nome do posto ou cidade"
              value={posto}
              onChange={(e) => setPosto(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Registrar"}
          </Button>
        </form>
      )}

      <div className="rounded-lg border">
        <h2 className="border-b px-4 py-3 font-semibold">Histórico de abastecimentos</h2>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Frete</th>
              <th className="px-4 py-3 text-left">Descrição</th>
              <th className="px-4 py-3 text-right">Litros</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-left">Data</th>
            </tr>
          </thead>
          <tbody>
            {costRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                  Nenhum abastecimento registrado
                </td>
              </tr>
            ) : (
              costRows.map((entry) => {
                const freight = freightMap.get(entry.freight_id)
                return (
                  <tr key={entry.id} className="border-t">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/fretes/${entry.freight_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {freight?.code ?? entry.freight_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{entry.descricao ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {entry.litros != null
                        ? `${entry.litros.toLocaleString("pt-BR")} L`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatBRL(entry.valor)}</td>
                    <td className="px-4 py-3">{formatDate(entry.created_at)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
