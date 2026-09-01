"use client"

import { useState } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { toast } from "sonner"
import { Plus, RefreshCcw, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { FinanceMonthHub } from "@/components/financeiro/finance-month-hub"
import { FixedExpenseManagerSheet } from "@/components/financeiro/fixed-expense-manager-sheet"
import { DriverPaymentSheet } from "@/components/financeiro/driver-payment-sheet"
import { EntryDialog } from "@/components/financeiro/entry-dialog"
import { FixedExpenseDialog } from "@/components/financeiro/fixed-expense-dialog"
import {
  LaunchFixedDialog,
  DeleteFixedDialog,
  DeleteEntryDialog,
} from "@/components/financeiro/finance-confirm-dialogs"
import { useAuth } from "@/components/providers/auth-provider"
import { useCompetencia } from "@/hooks/use-competencia"
import {
  deleteFinanceEntry,
  invalidateFinanceCaches,
  syncFinanceFromFreights,
} from "@/lib/api/services/finance"
import {
  deleteFixedExpense,
  launchFixedExpense,
  listFixedExpenses,
} from "@/lib/api/services/fixed-expenses"
import { competenciaDefaultDate } from "@/lib/format/dates"
import { isAdminRole } from "@/lib/rbac/permissions"
import { cn } from "@/lib/utils"
import type { FinanceEntry, FixedExpense } from "@/types"

export function FinanceView() {
  const { user } = useAuth()
  const canAdmin = isAdminRole(user?.role) || user?.role === "financeiro"
  const { competencia, shift } = useCompetencia()

  const [syncing, setSyncing] = useState(false)
  const [fixedManagerOpen, setFixedManagerOpen] = useState(false)
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false)
  const [activeDriverId, setActiveDriverId] = useState<string | undefined>()
  const [entryDialog, setEntryDialog] = useState<{ open: boolean; entry?: FinanceEntry }>({
    open: false,
  })
  const [fixedDialog, setFixedDialog] = useState<{ open: boolean; item?: FixedExpense }>({
    open: false,
  })
  const [launchDialog, setLaunchDialog] = useState<{
    open: boolean
    item?: FixedExpense
    date: string
  }>({
    open: false,
    date: new Date().toISOString().slice(0, 10),
  })
  const [deleteFixedId, setDeleteFixedId] = useState<string | null>(null)
  const [deleteEntry, setDeleteEntry] = useState<FinanceEntry | null>(null)

  const { data: fixedExpenses, mutate: refreshFixed } = useSWR("fixed-expenses", listFixedExpenses)

  async function handleSync() {
    setSyncing(true)
    try {
      const stats = await syncFinanceFromFreights()
      invalidateFinanceCaches()
      toast.success(
        `Reparação: ${stats.receitas} receita(s) e ${stats.despesas} despesa(s) verificada(s).`,
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao sincronizar")
    } finally {
      setSyncing(false)
    }
  }

  async function handleLaunchFixed() {
    if (!launchDialog.item) return
    try {
      await launchFixedExpense(launchDialog.item.id, launchDialog.date || undefined)
      invalidateFinanceCaches()
      await refreshFixed()
      setLaunchDialog({ open: false, date: new Date().toISOString().slice(0, 10) })
      toast.success(`"${launchDialog.item.nome}" lançado como despesa pendente`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao lançar despesa")
    }
  }

  async function handleDeleteFixed() {
    if (!deleteFixedId) return
    try {
      await deleteFixedExpense(deleteFixedId)
      await refreshFixed()
      setDeleteFixedId(null)
      toast.success("Gasto fixo removido")
    } catch {
      toast.error("Erro ao remover gasto fixo")
    }
  }

  async function handleDeleteEntry() {
    if (!deleteEntry) return
    try {
      await deleteFinanceEntry(deleteEntry.id)
      invalidateFinanceCaches()
      setDeleteEntry(null)
      toast.success("Lançamento removido")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover lançamento")
    }
  }

  const defaultLaunchDate = competenciaDefaultDate(competencia.mes, competencia.ano)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle financeiro"
        description="Ledger mensal: despesas, receitas e gastos fixos em um só lugar."
        actions={
          canAdmin ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPaymentSheetOpen(true)}
              >
                <Wallet className="mr-1.5 h-4 w-4" />
                Fechamento
              </Button>
              <Button size="sm" onClick={() => setEntryDialog({ open: true })}>
                <Plus className="mr-1.5 h-4 w-4" />
                Novo lançamento
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={syncing}
                onClick={handleSync}
                title="Reparar inconsistências"
              >
                <RefreshCcw className={cn("h-4 w-4", syncing && "animate-spin")} />
                <span className="sr-only">Reparar inconsistências</span>
              </Button>
            </div>
          ) : null
        }
      />

      <FinanceMonthHub
        key={`${competencia.ano}-${competencia.mes}`}
        competencia={competencia}
        onShift={shift}
        canAdmin={canAdmin}
        onEditEntry={(entry) => setEntryDialog({ open: true, entry })}
        onDeleteEntry={setDeleteEntry}
        onOpenFixedManager={() => setFixedManagerOpen(true)}
        onNewEntry={() => setEntryDialog({ open: true })}
        onDriverFilterChange={setActiveDriverId}
      />

      {canAdmin && (
        <FixedExpenseManagerSheet
          open={fixedManagerOpen}
          onOpenChange={setFixedManagerOpen}
          items={fixedExpenses ?? []}
          onCreate={() => {
            setFixedManagerOpen(false)
            setFixedDialog({ open: true })
          }}
          onEdit={(item) => {
            setFixedManagerOpen(false)
            setFixedDialog({ open: true, item })
          }}
          onDelete={setDeleteFixedId}
          onLaunch={(item) =>
            setLaunchDialog({ open: true, item, date: defaultLaunchDate })
          }
        />
      )}

      {canAdmin && (
        <DriverPaymentSheet
          open={paymentSheetOpen}
          onOpenChange={setPaymentSheetOpen}
          initialDriverId={activeDriverId}
        />
      )}

      <EntryDialog
        open={entryDialog.open}
        entry={entryDialog.entry}
        competencia={competencia}
        onOpenChange={(open) => setEntryDialog({ open })}
        onSave={async () => {
          invalidateFinanceCaches()
        }}
      />

      <FixedExpenseDialog
        open={fixedDialog.open}
        item={fixedDialog.item}
        onOpenChange={(open) => setFixedDialog({ open })}
        onSave={async () => {
          await refreshFixed()
          await globalMutate("fixed-expenses")
        }}
      />

      <LaunchFixedDialog
        open={launchDialog.open}
        item={launchDialog.item}
        date={launchDialog.date}
        onDateChange={(d) => setLaunchDialog((s) => ({ ...s, date: d }))}
        onClose={() => setLaunchDialog((s) => ({ ...s, open: false }))}
        onConfirm={handleLaunchFixed}
      />

      <DeleteFixedDialog
        open={Boolean(deleteFixedId)}
        onClose={() => setDeleteFixedId(null)}
        onConfirm={handleDeleteFixed}
      />

      <DeleteEntryDialog
        entry={deleteEntry}
        onClose={() => setDeleteEntry(null)}
        onConfirm={handleDeleteEntry}
      />
    </div>
  )
}
