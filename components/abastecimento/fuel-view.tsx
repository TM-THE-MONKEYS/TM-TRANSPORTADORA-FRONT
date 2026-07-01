"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import { CircleDollarSign, Fuel, Gauge, Route } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { useAuth } from "@/components/providers/auth-provider"
import { listDrivers } from "@/lib/api/services/drivers"
import { listFreights } from "@/lib/api/services/freight"
import { listAllFuelRefills, registerFuelRefill } from "@/lib/api/services/fuel"
import { resolveDriverDisplayName } from "@/lib/drivers/display-name"
import { resolveDriverIdForUser } from "@/lib/drivers/resolve-driver"
import { isFreightClosed } from "@/lib/freight/closed-freight"
import {
  canDriverRefuelFreight,
  canRegisterFuelForFreight,
  filterFreightsForFuel,
  isMotoristaRole,
} from "@/lib/fuel/eligibility"
import {
  formatKm,
  formatKmInput,
  formatLitersInput,
  formatMoneyInput,
  parseKmInput,
  parseLitersInput,
  parseMoneyInput,
} from "@/lib/format/numbers"
import { useOperationContext } from "@/hooks/use-operation-context"
import { getDriverName, getTruckLabel } from "@/lib/freight/active-trip"
import { formatBRL } from "@/lib/format/currency"
import { usePermission } from "@/hooks/use-permission"
import { isAdminRole, PERMISSIONS } from "@/lib/rbac/permissions"
import { FREIGHT_STATUS_LABELS } from "@/lib/freight/status"

function formatDate(dateStr?: string) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("pt-BR")
}

export function FuelView() {
  const searchParams = useSearchParams()
  const presetFreightId = searchParams.get("freightId") ?? ""
  const allowClosedParam = searchParams.get("allowClosed") === "1"

  const { user } = useAuth()
  const isMotorista = isMotoristaRole(user)
  const isAdmin = isAdminRole(user?.role)
  const allowClosedFuel = allowClosedParam && isAdmin && !isMotorista
  const [freightId, setFreightId] = useState("")
  const [valorDisplay, setValorDisplay] = useState("")
  const [litrosDisplay, setLitrosDisplay] = useState("")
  const [posto, setPosto] = useState("")
  const [kmDisplay, setKmDisplay] = useState("")
  const [saving, setSaving] = useState(false)

  const { trucks } = useOperationContext()
  const { data: driversPage } = useSWR("fuel-drivers", () => listDrivers(1, 100))
  const { data: freightsPage } = useSWR("fuel-freights", () => listFreights(1, 100))
  const {
    data: refills,
    error: refillsError,
    isLoading: loadingRefills,
    mutate: refreshRefills,
  } = useSWR("fuel-refills-all", () => listAllFuelRefills(1, 100))

  const canManageFuel = usePermission(PERMISSIONS.freightWrite) || isAdminRole(user?.role)

  const drivers = driversPage?.items ?? []
  const currentDriverId = user ? resolveDriverIdForUser(user, drivers) : null
  const canRegisterFuel = (isMotorista && Boolean(currentDriverId)) || canManageFuel

  const eligibleFreights = useMemo(() => {
    if (!freightsPage?.items) return []
    return filterFreightsForFuel(freightsPage.items, {
      driverId: isMotorista ? currentDriverId : undefined,
      includeClosed: allowClosedFuel,
    })
  }, [freightsPage?.items, isMotorista, currentDriverId, allowClosedFuel])

  const freightMap = useMemo(
    () => new Map((freightsPage?.items ?? []).map((f) => [f.id, f])),
    [freightsPage?.items],
  )

  const visibleRefills = useMemo(() => {
    const all = refills ?? []
    if (!isMotorista || !currentDriverId) return all
    return all.filter((r) => r.driver_id === currentDriverId)
  }, [refills, isMotorista, currentDriverId])

  const selectedFreight =
    eligibleFreights.find((f) => f.id === freightId) ??
    (allowClosedFuel ? freightMap.get(freightId) : undefined)
  const selectedTruck = useMemo(
    () => trucks.find((t) => t.id === selectedFreight?.truck_id),
    [trucks, selectedFreight?.truck_id],
  )

  useEffect(() => {
    if (presetFreightId && eligibleFreights.some((f) => f.id === presetFreightId)) {
      setFreightId(presetFreightId)
      return
    }
    if (eligibleFreights.length === 1) setFreightId(eligibleFreights[0].id)
  }, [eligibleFreights, presetFreightId])

  useEffect(() => {
    setKmDisplay("")
  }, [freightId])

  // KPI totals
  const totalValue = useMemo(
    () => visibleRefills.reduce((sum, r) => sum + r.valor_total, 0),
    [visibleRefills],
  )
  const totalLiters = useMemo(
    () => visibleRefills.reduce((sum, r) => sum + r.litros, 0),
    [visibleRefills],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const valor_total = parseMoneyInput(valorDisplay)
    const litros = parseLitersInput(litrosDisplay)

    if (!freightId) { toast.error("Selecione a ordem de frete"); return }
    if (valor_total <= 0) { toast.error("Informe o valor do abastecimento"); return }
    if (litros <= 0) { toast.error("Informe os litros abastecidos"); return }
    if (!selectedFreight) { toast.error("Frete inválido ou indisponível"); return }
    if (!selectedFreight.driver_id) { toast.error("Vincule um motorista ao frete antes de abastecer"); return }

    const adminOverride =
      allowClosedFuel && isFreightClosed(selectedFreight.status)

    if (!adminOverride && !selectedFreight.truck_id) {
      toast.error("Vincule um caminhão ao frete para registrar a quilometragem")
      return
    }

    const km_atual = parseKmInput(kmDisplay)
    if (!adminOverride) {
      if (km_atual <= 0) { toast.error("Informe a quilometragem atual do caminhão"); return }
      if (selectedTruck && km_atual < selectedTruck.mileage_km) {
        toast.error(`A quilometragem não pode ser menor que a da frota (${formatKm(selectedTruck.mileage_km)})`)
        return
      }
    } else if (kmDisplay.trim() && km_atual <= 0) {
      toast.error("Quilometragem inválida")
      return
    }

    let driverIdForRefill: string

    if (isMotorista) {
      if (!currentDriverId) { toast.error("Seu usuário não está vinculado a um cadastro de motorista"); return }
      if (!canDriverRefuelFreight(selectedFreight, currentDriverId)) {
        toast.error("Somente o motorista deste frete pode registrar o abastecimento")
        return
      }
      driverIdForRefill = currentDriverId
    } else if (canManageFuel) {
      if (
        !canRegisterFuelForFreight(selectedFreight, selectedFreight.driver_id, {
          adminOverride,
        })
      ) {
        toast.error("Abastecimento não permitido para este frete")
        return
      }
      driverIdForRefill = selectedFreight.driver_id
    } else {
      toast.error("Sem permissão para registrar abastecimento")
      return
    }

    setSaving(true)
    try {
      await registerFuelRefill({
        freight_id: freightId,
        driver_id: driverIdForRefill,
        litros,
        valor_total,
        km_atual: km_atual > 0 ? km_atual : undefined,
        posto: posto.trim() || undefined,
        observacoes: posto.trim() || undefined,
        admin_override: adminOverride || undefined,
      })
      toast.success("Abastecimento registrado e quilometragem da frota atualizada")
      setValorDisplay("")
      setLitrosDisplay("")
      setPosto("")
      setKmDisplay("")
      await refreshRefills(undefined, { revalidate: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Abastecimento"
        description={
          isMotorista
            ? "Registre abastecimento apenas nos fretes em que você está vinculado"
            : canManageFuel
              ? "Registre abastecimentos em fretes em andamento (motorista do frete)"
              : "Histórico de abastecimentos da frota"
        }
      />

      {isMotorista && !currentDriverId && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Conta de motorista sem vínculo ao cadastro de motoristas. Peça ao administrador para
          associar seu usuário ao registro do motorista.
        </p>
      )}

      {/* KPI strip */}
      {!loadingRefills && visibleRefills.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <CircleDollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total gasto</p>
                <p className="text-lg font-semibold tabular-nums">{formatBRL(totalValue)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Fuel className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total em litros</p>
                <p className="text-lg font-semibold tabular-nums">
                  {totalLiters.toLocaleString("pt-BR")} L
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Route className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Abastecimentos</p>
                <p className="text-lg font-semibold tabular-nums">{visibleRefills.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Form card — centered */}
      {canRegisterFuel && (
        <div className="flex justify-center">
          <Card className="w-full max-w-2xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                  <Fuel className="h-4 w-4 text-primary" />
                </span>
                {allowClosedFuel ? "Abastecimento retroativo (admin)" : "Registrar abastecimento"}
              </CardTitle>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6">
              {allowClosedFuel && (
                <p className="mb-4 rounded-md border border-amber-200/80 bg-amber-50/50 px-3 py-2 text-xs text-muted-foreground dark:border-amber-900/50 dark:bg-amber-950/20">
                  Modo administrativo: permite lançar abastecimento em frete já encerrado.
                  {presetFreightId && (
                    <>
                      {" "}
                      <Link href={`/dashboard/fretes/${presetFreightId}`} className="text-primary underline">
                        Voltar ao frete
                      </Link>
                    </>
                  )}
                </p>
              )}
              {eligibleFreights.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {allowClosedFuel
                    ? "Nenhum frete com motorista vinculado disponível para abastecimento retroativo."
                    : `Nenhum frete em andamento${isMotorista ? " com você como motorista" : " com motorista vinculado"}. Fretes concluídos ou cancelados não aparecem aqui.`}
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Freight selector */}
                  <div className="space-y-2">
                    <Label>Ordem de frete</Label>
                    <Select value={freightId} onValueChange={setFreightId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o frete" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleFreights.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.code} — {f.origin_city} → {f.destination_city} (
                            {FREIGHT_STATUS_LABELS[f.status]})
                            {f.driver_id && canManageFuel && !isMotorista
                              ? ` · ${getDriverName(drivers, f.driver_id) ?? "Motorista"}`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Truck km block */}
                  {freightId && (
                    selectedFreight?.truck_id ? (
                      <div className="flex items-start gap-3 rounded-xl border bg-muted/40 px-4 py-3">
                        <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="w-full space-y-2">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Quilometragem atual do caminhão
                            </p>
                            <p className="mt-0.5 text-sm">
                              Veículo:{" "}
                              <span className="font-medium">
                                {getTruckLabel(trucks, selectedFreight.truck_id) ?? "—"}
                              </span>
                              {selectedTruck && (
                                <span className="text-muted-foreground">
                                  {" "}· Km na frota: {formatKm(selectedTruck.mileage_km)}
                                </span>
                              )}
                            </p>
                          </div>
                          <Input
                            id="fuel-km"
                            inputMode="numeric"
                            placeholder={
                              selectedTruck
                                ? `Ex.: ${formatKmInput(String(Math.round(selectedTruck.mileage_km)))}`
                                : "Ex.: 185.420"
                            }
                            value={kmDisplay}
                            onChange={(e) => setKmDisplay(formatKmInput(e.target.value))}
                          />
                          <p className="text-xs text-muted-foreground">
                            Atualiza o hodômetro do veículo na frota em tempo real.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="rounded-xl border border-amber-400/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                        Este frete não tem caminhão vinculado. Peça ao operador para atribuir um
                        veículo antes do abastecimento.
                      </p>
                    )
                  )}

                  <Separator />

                  {/* Value + Liters */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fuel-valor">
                        Valor <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
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
                      <Label htmlFor="fuel-litros">
                        Litros <span className="text-destructive">*</span>
                      </Label>
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

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={saving || !freightId || !selectedFreight?.truck_id}
                  >
                    {saving ? "Salvando..." : "Registrar abastecimento"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!canRegisterFuel && !isMotorista && (
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para registrar abastecimentos. Apenas visualização do histórico.
        </p>
      )}

      {/* History table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">
            {isMotorista ? "Meus abastecimentos" : "Histórico de abastecimentos"}
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Frete</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Motorista</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Descrição</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Km</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Litros</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Valor</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {loadingRefills ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                    Carregando histórico...
                  </td>
                </tr>
              ) : refillsError ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-destructive">
                    Não foi possível carregar o histórico. Verifique se a API está no ar e tente
                    novamente.
                  </td>
                </tr>
              ) : visibleRefills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                    Nenhum abastecimento registrado
                  </td>
                </tr>
              ) : (
                visibleRefills.map((entry) => {
                  const freight = freightMap.get(entry.freight_id)
                  return (
                    <tr
                      key={entry.id}
                      className="border-b transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/dashboard/fretes/${entry.freight_id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {freight?.code ?? entry.freight_code ?? entry.freight_id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {resolveDriverDisplayName(entry, drivers)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {entry.posto ?? entry.cidade ?? "Abastecimento"}
                        {entry.posto && entry.cidade ? ` · ${entry.cidade}` : ""}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                        {entry.km_atual != null ? formatKm(entry.km_atual) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {entry.litros.toLocaleString("pt-BR")} L
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">
                        {formatBRL(entry.valor_total)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDate(entry.created_at)}
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
