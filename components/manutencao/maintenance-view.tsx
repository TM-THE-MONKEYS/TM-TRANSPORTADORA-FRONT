"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { toast } from "sonner"
import {
  AlertTriangle,
  CalendarClock,
  CircleDollarSign,
  Gauge,
  Play,
  Truck,
  Wrench,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useAuth } from "@/components/providers/auth-provider"
import {
  advanceMaintenanceStatus,
  createMaintenance,
  getMaintenanceAlerts,
  listMaintenances,
} from "@/lib/api/services/maintenance"
import { filterTrucksForMaintenance } from "@/lib/maintenance/eligibility"
import { useOperationContext } from "@/hooks/use-operation-context"
import { getTruckLabel } from "@/lib/freight/active-trip"
import { formatBRL } from "@/lib/format/currency"
import {
  formatKm,
  formatKmInput,
  formatMoneyInput,
  parseKmInput,
  parseMoneyInput,
} from "@/lib/format/numbers"
import { usePermission } from "@/hooks/use-permission"
import { isAdminRole, PERMISSIONS } from "@/lib/rbac/permissions"
import type { MaintenanceStatus, MaintenanceType } from "@/types"

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  agendada: "Agendada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
}

const STATUS_VARIANT: Record<MaintenanceStatus, "secondary" | "default" | "success" | "outline"> = {
  agendada: "secondary",
  em_andamento: "default",
  concluida: "success",
  cancelada: "outline",
}

const TYPE_LABELS: Record<MaintenanceType, string> = {
  preventiva: "Preventiva",
  corretiva: "Corretiva",
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("pt-BR")
}

export function MaintenanceView() {
  const { user } = useAuth()
  const { trucks, freights } = useOperationContext()
  const canManage = usePermission(PERMISSIONS.fleetWrite) || isAdminRole(user?.role)

  const [truckId, setTruckId] = useState("")
  const [tipo, setTipo] = useState<MaintenanceType>("preventiva")
  const [descricao, setDescricao] = useState("")
  const [oficina, setOficina] = useState("")
  const [dataAgendada, setDataAgendada] = useState("")
  const [kmDisplay, setKmDisplay] = useState("")
  const [proxKmDisplay, setProxKmDisplay] = useState("")
  const [custoDisplay, setCustoDisplay] = useState("")
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    id: string
    status: MaintenanceStatus
    label: string
  } | null>(null)

  const { data: alertsData, isLoading: loadingAlerts } = useSWR(
    "maintenance-alerts",
    () => getMaintenanceAlerts(30),
  )

  const {
    data: maintenancePage,
    error: listError,
    isLoading: loadingList,
    mutate: refreshList,
  } = useSWR("maintenance-list", () => listMaintenances(1, 100))

  const alerts = alertsData ?? []
  const items = maintenancePage?.items ?? []

  const eligibleTrucks = useMemo(
    () => filterTrucksForMaintenance(trucks, freights),
    [trucks, freights],
  )

  const selectedTruck = useMemo(
    () => trucks.find((t) => t.id === truckId),
    [trucks, truckId],
  )

  const truckMap = useMemo(() => new Map(trucks.map((t) => [t.id, t])), [trucks])

  useEffect(() => {
    if (eligibleTrucks.length === 1) setTruckId(eligibleTrucks[0].id)
  }, [eligibleTrucks])

  useEffect(() => {
    if (selectedTruck) {
      setKmDisplay(formatKmInput(String(Math.round(selectedTruck.mileage_km))))
    } else {
      setKmDisplay("")
    }
  }, [selectedTruck])

  const statusCounts = useMemo(() => {
    const counts: Record<MaintenanceStatus, number> = {
      agendada: 0,
      em_andamento: 0,
      concluida: 0,
      cancelada: 0,
    }
    for (const item of items) counts[item.status]++
    return counts
  }, [items])

  const totalCost = useMemo(
    () =>
      items
        .filter((i) => i.status === "em_andamento" || i.status === "concluida")
        .reduce((sum, i) => sum + (i.custo ?? 0), 0),
    [items],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!truckId) {
      toast.error("Selecione o veículo")
      return
    }
    if (!descricao.trim()) {
      toast.error("Informe a descrição da manutenção")
      return
    }
    if (!dataAgendada) {
      toast.error("Informe a data prevista")
      return
    }

    const km_na_manutencao = parseKmInput(kmDisplay)
    const proxima_manutencao_km = proxKmDisplay ? parseKmInput(proxKmDisplay) : undefined
    const custo = custoDisplay ? parseMoneyInput(custoDisplay) : undefined

    if (km_na_manutencao <= 0) {
      toast.error("Informe a quilometragem do veículo")
      return
    }
    if (selectedTruck && km_na_manutencao < selectedTruck.mileage_km) {
      toast.error(
        `Quilometragem não pode ser menor que a da frota (${formatKm(selectedTruck.mileage_km)})`,
      )
      return
    }

    setSaving(true)
    try {
      await createMaintenance({
        truck_id: truckId,
        tipo,
        status: "agendada",
        descricao: descricao.trim(),
        oficina: oficina.trim() || undefined,
        data_agendada: dataAgendada,
        km_na_manutencao,
        proxima_manutencao_km: proxima_manutencao_km && proxima_manutencao_km > 0 ? proxima_manutencao_km : undefined,
        custo: custo && custo > 0 ? custo : undefined,
      })
      toast.success("Manutenção agendada")
      setDescricao("")
      setOficina("")
      setDataAgendada("")
      setProxKmDisplay("")
      setCustoDisplay("")
      await refreshList(undefined, { revalidate: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao agendar")
    } finally {
      setSaving(false)
    }
  }

  function openConfirm(id: string, status: MaintenanceStatus, label: string) {
    setConfirmAction({ id, status, label })
    setConfirmOpen(true)
  }

  async function handleConfirmAction() {
    if (!confirmAction) return

    setActionLoading(confirmAction.id)
    try {
      await advanceMaintenanceStatus(confirmAction.id, confirmAction.status)
      toast.success(confirmAction.label)
      setConfirmOpen(false)
      await refreshList(undefined, { revalidate: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar status")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manutenção de Frota"
        description="Agende, acompanhe e conclua manutenções. Veículos em andamento ficam indisponíveis na frota."
      />

      {!loadingAlerts && alerts.length > 0 && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-500/5 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">
                {alerts.length} manutenção(ões) agendada(s) nos próximos 30 dias
              </p>
              <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-400">
                {alerts.map((alert) => (
                  <li key={alert.id}>
                    {getTruckLabel(trucks, alert.truck_id) ?? alert.truck_id.slice(0, 8)} —{" "}
                    {TYPE_LABELS[alert.tipo]} · {alert.descricao ?? "Manutenção"}
                    {alert.data_agendada ? ` · ${formatDate(alert.data_agendada)}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {!loadingList && items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-0 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <CalendarClock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Agendadas</p>
                <p className="text-lg font-semibold tabular-nums">{statusCounts.agendada}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Em andamento</p>
                <p className="text-lg font-semibold tabular-nums">{statusCounts.em_andamento}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Concluídas</p>
                <p className="text-lg font-semibold tabular-nums">{statusCounts.concluida}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <CircleDollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Custo (ativas + concl.)</p>
                <p className="text-lg font-semibold tabular-nums">{formatBRL(totalCost)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {canManage && (
        <div className="flex justify-center">
          <Card className="w-full max-w-2xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                  <Wrench className="h-4 w-4 text-primary" />
                </span>
                Agendar manutenção
              </CardTitle>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6">
              {eligibleTrucks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum veículo disponível para manutenção. Caminhões em viagem ou inativos não
                  aparecem aqui.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label>
                      Veículo <span className="text-destructive">*</span>
                    </Label>
                    <Select value={truckId} onValueChange={setTruckId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o caminhão" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleTrucks.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.plate} — {t.brand} {t.model} ({formatKm(t.mileage_km)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTruck && (
                    <div className="flex items-start gap-3 rounded-xl border bg-muted/40 px-4 py-3">
                      <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="w-full space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Quilometragem na manutenção
                        </p>
                        <Input
                          inputMode="numeric"
                          placeholder={formatKmInput(String(Math.round(selectedTruck.mileage_km)))}
                          value={kmDisplay}
                          onChange={(e) => setKmDisplay(formatKmInput(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>
                        Tipo <span className="text-destructive">*</span>
                      </Label>
                      <Select value={tipo} onValueChange={(v) => setTipo(v as MaintenanceType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="preventiva">Preventiva</SelectItem>
                          <SelectItem value="corretiva">Corretiva</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maint-date">
                        Data prevista <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="maint-date"
                        type="date"
                        value={dataAgendada}
                        onChange={(e) => setDataAgendada(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maint-desc">
                      Descrição <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="maint-desc"
                      placeholder="Ex.: Revisão 200.000 km, troca de pneus..."
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="maint-oficina">Oficina / fornecedor</Label>
                      <Input
                        id="maint-oficina"
                        placeholder="Nome da oficina"
                        value={oficina}
                        onChange={(e) => setOficina(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maint-prox-km">Próxima revisão (km)</Label>
                      <Input
                        id="maint-prox-km"
                        inputMode="numeric"
                        placeholder="Ex.: 200.000"
                        value={proxKmDisplay}
                        onChange={(e) => setProxKmDisplay(formatKmInput(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maint-custo">Custo estimado</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        R$
                      </span>
                      <Input
                        id="maint-custo"
                        inputMode="numeric"
                        className="pl-9"
                        placeholder="0,00"
                        value={custoDisplay}
                        onChange={(e) => setCustoDisplay(formatMoneyInput(e.target.value))}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={saving || !truckId}>
                    {saving ? "Salvando..." : "Agendar manutenção"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!canManage && (
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para agendar manutenções. Apenas visualização do histórico.
        </p>
      )}

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Histórico de manutenções</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Veículo</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Descrição</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Oficina</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Prevista</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Km</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Custo</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                {canManage && (
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr>
                  <td
                    colSpan={canManage ? 9 : 8}
                    className="px-5 py-10 text-center text-muted-foreground"
                  >
                    Carregando histórico...
                  </td>
                </tr>
              ) : listError ? (
                <tr>
                  <td
                    colSpan={canManage ? 9 : 8}
                    className="px-5 py-10 text-center text-destructive"
                  >
                    Não foi possível carregar manutenções. Verifique se a API está no ar.
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 9 : 8}
                    className="px-5 py-10 text-center text-muted-foreground"
                  >
                    Nenhuma manutenção registrada
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const truck = truckMap.get(item.truck_id)
                  return (
                    <tr
                      key={item.id}
                      className="border-b transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/dashboard/frota/${item.truck_id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {getTruckLabel(trucks, item.truck_id) ??
                            truck?.plate ??
                            item.truck_id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline">{TYPE_LABELS[item.tipo]}</Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{item.descricao ?? "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{item.oficina ?? "—"}</td>
                      <td className="px-5 py-3">{formatDate(item.data_agendada)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                        {item.km_na_manutencao != null ? formatKm(item.km_na_manutencao) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">
                        {item.custo != null ? formatBRL(item.custo) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={STATUS_VARIANT[item.status]}>
                          {STATUS_LABELS[item.status]}
                        </Badge>
                      </td>
                      {canManage && (
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.status === "agendada" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1"
                                disabled={actionLoading === item.id}
                                onClick={() =>
                                  openConfirm(item.id, "em_andamento", "Manutenção iniciada")
                                }
                              >
                                <Play className="h-3.5 w-3.5" />
                                Iniciar
                              </Button>
                            )}
                            {item.status === "em_andamento" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-green-700 hover:text-green-700"
                                disabled={actionLoading === item.id}
                                onClick={() =>
                                  openConfirm(item.id, "concluida", "Manutenção concluída")
                                }
                              >
                                <Wrench className="h-3.5 w-3.5" />
                                Concluir
                              </Button>
                            )}
                            {(item.status === "agendada" || item.status === "em_andamento") && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-destructive hover:text-destructive"
                                disabled={actionLoading === item.id}
                                onClick={() =>
                                  openConfirm(item.id, "cancelada", "Manutenção cancelada")
                                }
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar ação"
        description={
          confirmAction?.status === "em_andamento"
            ? "O veículo será marcado como em manutenção na frota e ficará indisponível para fretes."
            : confirmAction?.status === "concluida"
              ? "A manutenção será concluída e o veículo voltará a ficar disponível (ou em viagem, se houver frete ativo)."
              : "A manutenção será cancelada."
        }
        confirmLabel="Confirmar"
        loading={Boolean(actionLoading)}
        onConfirm={handleConfirmAction}
      />
    </div>
  )
}
