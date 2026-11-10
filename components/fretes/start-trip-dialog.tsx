"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { endFreightOdometer, startFreightTrip } from "@/lib/api/services/freight"
import { formatKm, formatKmInput, parseKmInput } from "@/lib/format/numbers"
import type { FreightOrder } from "@/types"

type StartTripDialogProps = {
  freight: FreightOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (freight: FreightOrder) => void
}

export function StartTripDialog({
  freight,
  open,
  onOpenChange,
  onSuccess,
}: StartTripDialogProps) {
  const [kmDisplay, setKmDisplay] = useState("")
  const [checkDocs, setCheckDocs] = useState(false)
  const [checkVeiculo, setCheckVeiculo] = useState(false)
  const [checkCarga, setCheckCarga] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setKmDisplay("")
    setCheckDocs(false)
    setCheckVeiculo(false)
    setCheckCarga(false)
    setSubmitting(false)
  }, [open, freight?.id])

  const kmInicial = parseKmInput(kmDisplay)
  const canSubmit =
    kmInicial > 0 && checkDocs && checkVeiculo && checkCarga && !submitting && freight != null

  async function handleSubmit() {
    if (!freight || !canSubmit) return
    setSubmitting(true)
    try {
      const updated = await startFreightTrip(freight.id, {
        km_inicial: kmInicial,
        check_docs: true,
        check_veiculo: true,
        check_carga: true,
      })
      toast.success(`Viagem iniciada — KM ${formatKm(updated.km_inicial)}`)
      onOpenChange(false)
      onSuccess?.(updated)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao iniciar viagem")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Iniciar viagem</DialogTitle>
          <DialogDescription>
            {freight
              ? `Registre o KM inicial e confirme o checklist de ${freight.code}.`
              : "Registre o KM inicial e confirme o checklist."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="start-trip-km">KM inicial</Label>
            <Input
              id="start-trip-km"
              inputMode="numeric"
              placeholder="Ex.: 185.420"
              value={kmDisplay}
              onChange={(e) => setKmDisplay(formatKmInput(e.target.value))}
              autoComplete="off"
            />
          </div>

          <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Checklist obrigatório
            </p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="start-check-docs"
                checked={checkDocs}
                onCheckedChange={(v) => setCheckDocs(v === true)}
              />
              <Label htmlFor="start-check-docs" className="cursor-pointer font-normal">
                Documentos / CNH ok
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="start-check-veiculo"
                checked={checkVeiculo}
                onCheckedChange={(v) => setCheckVeiculo(v === true)}
              />
              <Label htmlFor="start-check-veiculo" className="cursor-pointer font-normal">
                Veículo conferido
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="start-check-carga"
                checked={checkCarga}
                onCheckedChange={(v) => setCheckCarga(v === true)}
              />
              <Label htmlFor="start-check-carga" className="cursor-pointer font-normal">
                Carga conferida
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {submitting ? "Iniciando..." : "Iniciar viagem"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type EndOdometerDialogProps = {
  freight: FreightOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (freight: FreightOrder) => void
}

export function EndOdometerDialog({
  freight,
  open,
  onOpenChange,
  onSuccess,
}: EndOdometerDialogProps) {
  const [kmDisplay, setKmDisplay] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setKmDisplay("")
    setSubmitting(false)
  }, [open, freight?.id])

  const kmFinal = parseKmInput(kmDisplay)
  const minKm = freight?.km_inicial ?? 0
  const canSubmit =
    kmFinal > 0 &&
    (minKm <= 0 || kmFinal >= minKm) &&
    !submitting &&
    freight != null

  async function handleSubmit() {
    if (!freight || !canSubmit) return
    setSubmitting(true)
    try {
      const updated = await endFreightOdometer(freight.id, { km_final: kmFinal })
      toast.success(`KM final registrado — ${formatKm(updated.km_final)}`)
      onOpenChange(false)
      onSuccess?.(updated)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar KM final")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar KM final</DialogTitle>
          <DialogDescription>
            {freight
              ? `Encerre o odômetro de ${freight.code}${
                  freight.km_inicial != null
                    ? ` (mínimo: ${formatKm(freight.km_inicial)})`
                    : ""
                }.`
              : "Informe o KM final da viagem."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Label htmlFor="end-odo-km">KM final</Label>
          <Input
            id="end-odo-km"
            inputMode="numeric"
            placeholder="Ex.: 186.050"
            value={kmDisplay}
            onChange={(e) => setKmDisplay(formatKmInput(e.target.value))}
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {submitting ? "Salvando..." : "Registrar KM final"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
