"use client"

import { Button } from "@/components/ui/button"
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
import { formatBRL } from "@/lib/format/currency"
import type { FinanceEntry, FixedExpense } from "@/types"

// ── Lançar despesa fixa ───────────────────────────────────────────────────────

interface LaunchDialogProps {
  open: boolean
  item?: FixedExpense
  date: string
  onDateChange: (d: string) => void
  onClose: () => void
  onConfirm: () => void
}

export function LaunchFixedDialog({
  open,
  item,
  date,
  onDateChange,
  onClose,
  onConfirm,
}: LaunchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Lançar despesa</DialogTitle>
          <DialogDescription>
            Cria um lançamento pendente de{" "}
            <strong>{formatBRL(item?.valor ?? 0)}</strong> para{" "}
            <strong>{item?.nome}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="launch-due-date">Data de vencimento</Label>
          <Input
            id="launch-due-date"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>Confirmar lançamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Remover gasto fixo ────────────────────────────────────────────────────────

interface DeleteFixedDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteFixedDialog({ open, onClose, onConfirm }: DeleteFixedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Remover gasto fixo</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O gasto fixo será removido permanentemente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Remover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Excluir lançamento ────────────────────────────────────────────────────────

interface DeleteEntryDialogProps {
  entry: FinanceEntry | null
  onClose: () => void
  onConfirm: () => void
}

export function DeleteEntryDialog({ entry, onClose, onConfirm }: DeleteEntryDialogProps) {
  return (
    <Dialog open={Boolean(entry)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Excluir lançamento</DialogTitle>
          <DialogDescription>
            {entry ? (
              <>
                Remover permanentemente{" "}
                <strong>
                  {entry.tipo === "receita" ? "receita" : "despesa"} de{" "}
                  {formatBRL(entry.valor)}
                </strong>
                {entry.descricao ? <> ({entry.descricao})</> : null}? Esta ação não pode
                ser desfeita.
              </>
            ) : (
              "Esta ação não pode ser desfeita."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
