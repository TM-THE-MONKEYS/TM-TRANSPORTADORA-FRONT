"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { toast } from "sonner"
import { CircleDollarSign, MapPin, Route } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { useAuth } from "@/components/providers/auth-provider"
import {
  getActiveFreight,
  listAllTolls,
  listEligibleFreights,
  registerToll,
} from "@/lib/api/services/tolls"
import { formatMoneyInput, parseMoneyInput } from "@/lib/format/numbers"
import { formatBRL } from "@/lib/format/currency"
import { useOperationContext } from "@/hooks/use-operation-context"
import { usePermission } from "@/hooks/use-permission"
import { resolveDriverDisplayName } from "@/lib/drivers/display-name"
import { isAdminRole, PERMISSIONS } from "@/lib/rbac/permissions"

function formatDateBR(dateStr?: string) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("pt-BR")
}

function isMotoristaRole(user: { role?: string } | null | undefined): boolean {
  return user?.role === "motorista"
}

export function TollView() {
  const { user } = useAuth()
  const { drivers } = useOperationContext()
  const isMotorista = isMotoristaRole(user)
  const canManageTolls = usePermission(PERMISSIONS.freightWrite) || isAdminRole(user?.role)

  const [freightId, setFreightId] = useState("")
  const [valorDisplay, setValorDisplay] = useState("")
  const [countDisplay, setCountDisplay] = useState("1")
  const [plaza, setPlaza] = useState("")
  const [highway, setHighway] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const { data: eligibleFreights } = useSWR(
    !isMotorista && canManageTolls ? "toll-eligible-freights" : null,
    listEligibleFreights,
  )

  const { data: activeFreight, isLoading: loadingActive } = useSWR(
    isMotorista ? "toll-active-freight" : null,
    getActiveFreight,
  )

  const {
    data: tolls,
    error: tollsError,
    isLoading: loadingTolls,
    mutate: refreshTolls,
  } = useSWR("toll-list-all", () => listAllTolls(1, 100))

  useEffect(() => {
    if (isMotorista && activeFreight?.freightId) setFreightId(activeFreight.freightId)
  }, [isMotorista, activeFreight?.freightId])

  useEffect(() => {
    if (!isMotorista && eligibleFreights?.length === 1) setFreightId(eligibleFreights[0].freightId)
  }, [isMotorista, eligibleFreights])

  const freightMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const f of eligibleFreights ?? []) map.set(f.freightId, f.freightCode)
    if (activeFreight) map.set(activeFreight.freightId, activeFreight.freightCode)
    return map
  }, [eligibleFreights, activeFreight])

  const canRegisterToll = (isMotorista && Boolean(freightId)) || canManageTolls

  const totalValue = useMemo(
    () => (tolls ?? []).reduce((sum, t) => sum + t.valor, 0),
    [tolls],
  )
  const totalPlazas = useMemo(
    () => (tolls ?? []).reduce((sum, t) => sum + t.quantidade, 0),
    [tolls],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = parseMoneyInput(valorDisplay)
    const count = Math.max(1, parseInt(countDisplay || "1", 10) || 1)

    if (!freightId) { toast.error("Selecione a ordem de frete"); return }
    if (value <= 0) { toast.error("Informe o valor total do pedágio"); return }

    setSaving(true)
    try {
      await registerToll({
        freightId,
        value,
        count,
        plaza: plaza.trim() || undefined,
        highway: highway.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim().toUpperCase().slice(0, 2) || undefined,
        notes: notes.trim() || undefined,
        tollDate: new Date().toISOString(),
      })
      toast.success("Pedágio registrado com sucesso")
      setValorDisplay("")
      setCountDisplay("1")
      setPlaza("")
      setHighway("")
      setCity("")
      setState("")
      setNotes("")
      await refreshTolls(undefined, { revalidate: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar pedágio")
    } finally {
      setSaving(false)
    }
  }

  const visibleTolls = useMemo(() => {
    const all = tolls ?? []
    if (!isMotorista || !user?.driver_id) return all
    return all.filter((t) => t.driver_id != null && t.driver_id === user.driver_id)
  }, [tolls, isMotorista, user?.driver_id])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pedágios"
        description={
          isMotorista
            ? "Registre pedágios apenas no frete em que você está em viagem"
            : canManageTolls
              ? "Registre pedágios em fretes em andamento"
              : "Histórico de pedágios da frota"
        }
      />

      {/* KPI strip */}
      {!loadingTolls && visibleTolls.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <CircleDollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total pago</p>
                <p className="text-lg font-semibold tabular-nums">{formatBRL(totalValue)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total de praças</p>
                <p className="text-lg font-semibold tabular-nums">{totalPlazas}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Route className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Registros</p>
                <p className="text-lg font-semibold tabular-nums">{visibleTolls.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Form card — centered */}
      {canRegisterToll && (
        <div className="flex justify-center">
          <Card className="w-full max-w-2xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </span>
                Registrar pedágio
              </CardTitle>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Freight info */}
                {isMotorista ? (
                  loadingActive ? (
                    <p className="text-sm text-muted-foreground">Carregando frete em andamento...</p>
                  ) : activeFreight ? (
                    <div className="flex items-start gap-3 rounded-xl border bg-muted/40 px-4 py-3">
                      <Route className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Frete em andamento
                        </p>
                        <p className="mt-0.5 font-semibold">
                          {activeFreight.freightCode}
                        </p>
                        <p className="text-muted-foreground">
                          {activeFreight.originCity}/{activeFreight.originState} →{" "}
                          {activeFreight.destinationCity}/{activeFreight.destinationState}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-xl border border-amber-400/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                      Nenhum frete em andamento vinculado ao seu usuário.
                    </p>
                  )
                ) : (
                  <div className="space-y-2">
                    <Label>Ordem de frete</Label>
                    {(eligibleFreights ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum frete em andamento com motorista vinculado.
                      </p>
                    ) : (
                      <Select value={freightId} onValueChange={setFreightId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o frete" />
                        </SelectTrigger>
                        <SelectContent>
                          {(eligibleFreights ?? []).map((f) => (
                            <SelectItem key={f.freightId} value={f.freightId}>
                              {f.freightCode} — {f.originCity}/{f.originState} →{" "}
                              {f.destinationCity}/{f.destinationState} · {f.driverName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* Value + Count */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="toll-valor">
                      Valor total <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        R$
                      </span>
                      <Input
                        id="toll-valor"
                        inputMode="numeric"
                        className="pl-9"
                        placeholder="0,00"
                        value={valorDisplay}
                        onChange={(e) => setValorDisplay(formatMoneyInput(e.target.value))}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ex.: 3 praças × R$&nbsp;4,90 = R$&nbsp;14,70
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toll-count">Nº de praças</Label>
                    <Input
                      id="toll-count"
                      inputMode="numeric"
                      placeholder="1"
                      value={countDisplay}
                      onChange={(e) => setCountDisplay(e.target.value.replace(/\D/g, ""))}
                    />
                    <p className="text-xs text-muted-foreground">Quantas praças nesta cobrança</p>
                  </div>
                </div>

                <Separator />

                {/* Optional fields group */}
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Informações opcionais
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="toll-plaza">Nome da praça</Label>
                    <Input
                      id="toll-plaza"
                      placeholder="Ex.: Praça Pedro Moro"
                      value={plaza}
                      onChange={(e) => setPlaza(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toll-highway">Rodovia</Label>
                    <Input
                      id="toll-highway"
                      placeholder="Ex.: BR-376"
                      value={highway}
                      onChange={(e) => setHighway(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_80px]">
                  <div className="space-y-2">
                    <Label htmlFor="toll-city">Cidade</Label>
                    <Input
                      id="toll-city"
                      placeholder="Ex.: Ponta Grossa"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toll-state">UF</Label>
                    <Input
                      id="toll-state"
                      placeholder="PR"
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toll-notes">Observações</Label>
                  <Textarea
                    id="toll-notes"
                    placeholder="Anotações adicionais sobre este pedágio"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={saving || !freightId || (isMotorista && !activeFreight)}
                >
                  {saving ? "Salvando..." : "Registrar pedágio"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {!canRegisterToll && !isMotorista && (
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para registrar pedágios. Apenas visualização do histórico.
        </p>
      )}

      {/* History table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">
            {isMotorista ? "Meus pedágios" : "Histórico de pedágios"}
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Frete</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Motorista</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                  Praça / Rodovia
                </th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Praças</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Valor</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {loadingTolls ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    Carregando histórico...
                  </td>
                </tr>
              ) : tollsError ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-destructive">
                    Não foi possível carregar o histórico. Verifique se a API está no ar.
                  </td>
                </tr>
              ) : visibleTolls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    Nenhum pedágio registrado
                  </td>
                </tr>
              ) : (
                visibleTolls.map((toll) => {
                  const descParts: string[] = []
                  if (toll.praca) descParts.push(toll.praca)
                  if (toll.rodovia) descParts.push(toll.rodovia)
                  return (
                    <tr
                      key={toll.id}
                      className="border-b transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/dashboard/fretes/${toll.freight_id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {freightMap.get(toll.freight_id) ??
                            toll.freight_code ??
                            toll.freight_id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {resolveDriverDisplayName(toll, drivers)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {descParts.length > 0 ? descParts.join(" · ") : "—"}
                        {toll.cidade
                          ? ` · ${toll.cidade}${toll.estado ? `/${toll.estado}` : ""}`
                          : ""}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{toll.quantidade}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">
                        {formatBRL(toll.valor)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDateBR(toll.data_pedagio)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
