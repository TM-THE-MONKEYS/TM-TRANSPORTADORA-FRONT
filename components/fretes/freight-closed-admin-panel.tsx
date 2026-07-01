"use client"

import { useState } from "react"
import Link from "next/link"
import { mutate } from "swr"
import { toast } from "sonner"
import { AlertTriangle, RotateCcw, ShieldAlert } from "lucide-react"
import { FreightAddCostForm } from "@/components/fretes/freight-add-cost-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { updateFreightStatus } from "@/lib/api/services/freight"
import {
  ADMIN_FREIGHT_STATUS_OPTIONS,
  suggestedRevertStatus,
} from "@/lib/freight/closed-freight"
import { FREIGHT_STATUS_LABELS } from "@/lib/freight/status"
import type { FreightOrder, FreightStatus } from "@/types"

type FreightClosedAdminPanelProps = {
  freight: FreightOrder
  onUpdated?: () => void
}

export function FreightClosedAdminPanel({ freight, onUpdated }: FreightClosedAdminPanelProps) {
  const revert = suggestedRevertStatus(freight.status)
  const [newStatus, setNewStatus] = useState<FreightStatus>(revert ?? freight.status)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)

  async function handleStatusChange() {
    if (newStatus === freight.status) {
      toast.message("Selecione um status diferente do atual")
      return
    }
    setSavingStatus(true)
    try {
      await updateFreightStatus(freight.id, newStatus)
      await mutate(["freight", freight.id])
      await mutate(["freight-events", freight.id])
      toast.success(`Status alterado para ${FREIGHT_STATUS_LABELS[newStatus]}`)
      setConfirmOpen(false)
      onUpdated?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível alterar o status")
    } finally {
      setSavingStatus(false)
    }
  }

  return (
    <>
      <Card className="mb-6 border-amber-300/60 bg-amber-50/40 dark:border-amber-800/50 dark:bg-amber-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            Administração — frete encerrado
          </CardTitle>
          <CardDescription>
            Este frete está <strong>{FREIGHT_STATUS_LABELS[freight.status]}</strong>. Como
            administrador, você pode reabrir o status, lançar gastos retroativos ou registrar
            ocorrências na aba correspondente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              Alterar status
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1 space-y-2">
                <Label>Novo status</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as FreightStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_FREIGHT_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                        {opt.value === freight.status ? " (atual)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {revert && revert !== freight.status && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewStatus(revert)}
                >
                  Sugerir: {FREIGHT_STATUS_LABELS[revert]}
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                disabled={newStatus === freight.status}
                onClick={() => setConfirmOpen(true)}
              >
                Aplicar status
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Reabrir um frete entregue pode exigir ajuste manual de comissão e financeiro.
            </p>
          </section>

          <Separator />

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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar alteração de status</DialogTitle>
            <DialogDescription>
              Alterar <strong>{freight.code}</strong> de{" "}
              <strong>{FREIGHT_STATUS_LABELS[freight.status]}</strong> para{" "}
              <strong>{FREIGHT_STATUS_LABELS[newStatus]}</strong>? Esta ação é administrativa e
              pode impactar relatórios e financeiro.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={savingStatus}>
              Cancelar
            </Button>
            <Button onClick={handleStatusChange} disabled={savingStatus}>
              {savingStatus ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
