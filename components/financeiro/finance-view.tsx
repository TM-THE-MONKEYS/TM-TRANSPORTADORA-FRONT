"use client"

import { useState } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { toast } from "sonner"
import { MoreHorizontal, Plus, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { PageHeader } from "@/components/shared/page-header"
import { FinanceMonthHub } from "@/components/financeiro/finance-month-hub"
import { FixedExpenseManagerSheet } from "@/components/financeiro/fixed-expense-manager-sheet"
import { useAuth } from "@/components/providers/auth-provider"
import { useCompetencia } from "@/hooks/use-competencia"
import {
  createFinanceEntry,
  deleteFinanceEntry,
  invalidateFinanceCaches,
  syncFinanceFromFreights,
  updateFinanceEntry,
} from "@/lib/api/services/finance"
import {
  FIXED_EXPENSE_CATEGORIES,
  FREQUENCY_LABELS,
  createFixedExpense,
  deleteFixedExpense,
  launchFixedExpense,
  listFixedExpenses,
  updateFixedExpense,
} from "@/lib/api/services/fixed-expenses"
import { formatBRL } from "@/lib/format/currency"
import { competenciaDefaultDate, formatCompetenciaLabel } from "@/lib/format/dates"
import { isAdminRole } from "@/lib/rbac/permissions"
import { cn } from "@/lib/utils"
import type { FinanceEntry, FinanceEntryStatus, FinanceEntryType, FixedExpense } from "@/types"

export function FinanceView() {
  const { user } = useAuth()
  const canAdmin = isAdminRole(user?.role) || user?.role === "financeiro"
  const { competencia, shift } = useCompetencia()

  const [syncing, setSyncing] = useState(false)
  const [fixedManagerOpen, setFixedManagerOpen] = useState(false)
  const [entryDialog, setEntryDialog] = useState<{ open: boolean; entry?: FinanceEntry }>({ open: false })
  const [fixedDialog, setFixedDialog] = useState<{ open: boolean; item?: FixedExpense }>({ open: false })
  const [launchDialog, setLaunchDialog] = useState<{ open: boolean; item?: FixedExpense; date: string }>({
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
          <div className="flex gap-2">
            {canAdmin && (
              <>
                <Button size="sm" onClick={() => setEntryDialog({ open: true })}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Novo lançamento
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={syncing}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Mais ações</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleSync} disabled={syncing}>
                      <RefreshCcw className={cn("mr-2 h-4 w-4", syncing && "animate-spin")} />
                      {syncing ? "Reparando..." : "Reparar inconsistências"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
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
            setLaunchDialog({
              open: true,
              item,
              date: defaultLaunchDate,
            })
          }
        />
      )}

      {/* ── Dialogs ── */}

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

      {/* Launch confirm */}
      <Dialog
        open={launchDialog.open}
        onOpenChange={(open) => setLaunchDialog((s) => ({ ...s, open }))}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Lançar despesa</DialogTitle>
            <DialogDescription>
              Cria um lançamento pendente de{" "}
              <strong>{formatBRL(launchDialog.item?.valor ?? 0)}</strong> para{" "}
              <strong>{launchDialog.item?.nome}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Data de vencimento</Label>
            <Input
              type="date"
              value={launchDialog.date}
              onChange={(e) => setLaunchDialog((s) => ({ ...s, date: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLaunchDialog((s) => ({ ...s, open: false }))}
            >
              Cancelar
            </Button>
            <Button onClick={handleLaunchFixed}>Confirmar lançamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete fixed expense confirm */}
      <Dialog open={Boolean(deleteFixedId)} onOpenChange={() => setDeleteFixedId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover gasto fixo</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O gasto fixo será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFixedId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteFixed}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete finance entry confirm */}
      <Dialog open={Boolean(deleteEntry)} onOpenChange={() => setDeleteEntry(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir lançamento</DialogTitle>
            <DialogDescription>
              {deleteEntry ? (
                <>
                  Remover permanentemente{" "}
                  <strong>
                    {deleteEntry.tipo === "receita" ? "receita" : "despesa"} de{" "}
                    {formatBRL(deleteEntry.valor)}
                  </strong>
                  {deleteEntry.descricao ? (
                    <>
                      {" "}
                      ({deleteEntry.descricao})
                    </>
                  ) : null}
                  ? Esta ação não pode ser desfeita.
                </>
              ) : (
                "Esta ação não pode ser desfeita."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteEntry(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteEntry}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Entry Dialog ──────────────────────────────────────────────────────────────

type EntryForm = {
  tipo: FinanceEntryType
  categoria: string
  descricao: string
  valor: string
  status: FinanceEntryStatus
  data_vencimento: string
}

const ENTRY_DEFAULTS: EntryForm = {
  tipo: "despesa",
  categoria: "",
  descricao: "",
  valor: "",
  status: "pendente",
  data_vencimento: "",
}

function EntryDialog({
  open,
  entry,
  competencia,
  onOpenChange,
  onSave,
}: {
  open: boolean
  entry?: FinanceEntry
  competencia: { mes: number; ano: number }
  onOpenChange: (o: boolean) => void
  onSave: () => Promise<void>
}) {
  const isEdit = Boolean(entry)
  const [form, setForm] = useState<EntryForm>(ENTRY_DEFAULTS)
  const [saving, setSaving] = useState(false)
  const defaultVencimento = competenciaDefaultDate(competencia.mes, competencia.ano)

  function handleOpen(o: boolean) {
    if (o) {
      setForm(
        entry
          ? {
              tipo: entry.tipo,
              categoria: entry.categoria,
              descricao: entry.descricao ?? "",
              valor: String(entry.valor),
              status: entry.status,
              data_vencimento: entry.data_vencimento ?? "",
            }
          : {
              ...ENTRY_DEFAULTS,
              data_vencimento: defaultVencimento,
            },
      )
    }
    onOpenChange(o)
  }

  function set<K extends keyof EntryForm>(k: K, v: EntryForm[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    if (!form.categoria.trim()) { toast.error("Informe a categoria"); return }
    const valor = parseFloat(form.valor.replace(",", "."))
    if (!valor || valor <= 0) { toast.error("Valor inválido"); return }

    setSaving(true)
    try {
      const vencimento = form.data_vencimento || (!isEdit ? defaultVencimento : undefined)
      const payload = {
        tipo: form.tipo,
        categoria: form.categoria.trim(),
        descricao: form.descricao.trim() || undefined,
        valor,
        status: form.status,
        data_vencimento: vencimento,
      }
      if (isEdit && entry) {
        await updateFinanceEntry(entry.id, payload)
        toast.success("Lançamento atualizado")
      } else {
        await createFinanceEntry(payload as Parameters<typeof createFinanceEntry>[0])
        toast.success("Lançamento criado")
      }
      await onSave()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Altere os dados do lançamento financeiro."
              : `Registre na competência ${formatCompetenciaLabel(competencia.mes, competencia.ano)}. O vencimento define o mês do lançamento.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => set("tipo", v as FinanceEntryType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as FinanceEntryStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Categoria *</Label>
            <Input
              placeholder="Ex: Combustível, Manutenção, Frete..."
              value={form.categoria}
              onChange={(e) => set("categoria", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input
              placeholder="Descrição opcional"
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0,00"
                value={form.valor}
                onChange={(e) => set("valor", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={form.data_vencimento}
                onChange={(e) => set("data_vencimento", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={saving} onClick={handleSave}>
            {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar lançamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── FixedExpense Dialog ───────────────────────────────────────────────────────

type FxForm = {
  nome: string
  categoria: string
  valor: string
  frequencia: string
  dia_vencimento: string
  duracao_limitada: boolean
  total_parcelas: string
  data_inicio: string
  ativo: boolean
  observacao: string
}

const FX_DEFAULTS: FxForm = {
  nome: "",
  categoria: "Outros",
  valor: "",
  frequencia: "mensal",
  dia_vencimento: "",
  duracao_limitada: false,
  total_parcelas: "",
  data_inicio: "",
  ativo: true,
  observacao: "",
}

function FixedExpenseDialog({
  open,
  item,
  onOpenChange,
  onSave,
}: {
  open: boolean
  item?: FixedExpense
  onOpenChange: (o: boolean) => void
  onSave: () => Promise<void>
}) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState<FxForm>(FX_DEFAULTS)
  const [saving, setSaving] = useState(false)

  function handleOpen(o: boolean) {
    if (o) {
      setForm(
        item
          ? {
              nome: item.nome,
              categoria: item.categoria,
              valor: String(item.valor),
              frequencia: item.frequencia,
              dia_vencimento: item.dia_vencimento ? String(item.dia_vencimento) : "",
              duracao_limitada: Boolean(item.total_parcelas),
              total_parcelas: item.total_parcelas ? String(item.total_parcelas) : "",
              data_inicio: (item.data_inicio ?? item.created_at).slice(0, 10),
              ativo: item.ativo,
              observacao: item.observacao ?? "",
            }
          : {
              ...FX_DEFAULTS,
              data_inicio: new Date().toISOString().slice(0, 10),
            },
      )
    }
    onOpenChange(o)
  }

  function set<K extends keyof FxForm>(k: K, v: FxForm[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    if (!form.nome.trim()) { toast.error("Informe o nome"); return }
    const valor = parseFloat(form.valor.replace(",", "."))
    if (!valor || valor <= 0) { toast.error("Valor inválido"); return }

    let total_parcelas: number | null | undefined
    if (form.duracao_limitada) {
      const parcelas = Number.parseInt(form.total_parcelas, 10)
      if (!parcelas || parcelas <= 0) {
        toast.error("Informe o número de parcelas (meses)")
        return
      }
      total_parcelas = parcelas
    } else {
      total_parcelas = null
    }

    setSaving(true)
    try {
      const payload = {
        nome: form.nome.trim(),
        categoria: form.categoria,
        valor,
        frequencia: form.frequencia as FixedExpense["frequencia"],
        dia_vencimento: form.dia_vencimento ? Number(form.dia_vencimento) : undefined,
        total_parcelas,
        data_inicio: form.duracao_limitada ? form.data_inicio : undefined,
        parcelas_lancadas: item?.parcelas_lancadas ?? 0,
        ativo: form.ativo,
        observacao: form.observacao.trim() || undefined,
      }
      if (isEdit && item) {
        await updateFixedExpense(item.id, payload)
        toast.success("Gasto fixo atualizado")
      } else {
        await createFixedExpense(payload)
        toast.success("Gasto fixo criado")
      }
      await onSave()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar gasto fixo" : "Novo gasto fixo"}</DialogTitle>
          <DialogDescription>
            Gastos fixos representam despesas recorrentes. Opcionalmente defina parcelas para encerrar após X meses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input
              placeholder="Ex: Aluguel do galpão"
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => set("categoria", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIXED_EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Recorrência</Label>
              <Select value={form.frequencia} onValueChange={(v) => set("frequencia", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0,00"
                value={form.valor}
                onChange={(e) => set("valor", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dia de vencimento</Label>
              <Input
                type="number"
                min={1}
                max={31}
                placeholder="Ex: 10"
                value={form.dia_vencimento}
                onChange={(e) => set("dia_vencimento", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-3">
              <input
                id="fx-duracao"
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={form.duracao_limitada}
                onChange={(e) => set("duracao_limitada", e.target.checked)}
              />
              <Label htmlFor="fx-duracao" className="cursor-pointer font-normal">
                Duração limitada (parcelas/meses)
              </Label>
            </div>

            {form.duracao_limitada && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nº de parcelas *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={360}
                    placeholder="Ex: 12"
                    value={form.total_parcelas}
                    onChange={(e) => set("total_parcelas", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Início da vigência</Label>
                  <Input
                    type="date"
                    value={form.data_inicio}
                    onChange={(e) => set("data_inicio", e.target.value)}
                  />
                </div>
              </div>
            )}

            {form.duracao_limitada && (
              <p className="text-xs text-muted-foreground">
                Após {form.total_parcelas || "X"} mês(es), o gasto fixo encerra automaticamente
                {isEdit && item?.parcelas_lancadas
                  ? ` (${item.parcelas_lancadas} parcela(s) já lançada(s)).`
                  : "."}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Observação</Label>
            <Textarea
              placeholder="Notas adicionais (opcional)"
              value={form.observacao}
              onChange={(e) => set("observacao", e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
            <input
              id="fx-ativo"
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={form.ativo}
              onChange={(e) => set("ativo", e.target.checked)}
            />
            <Label htmlFor="fx-ativo" className="cursor-pointer font-normal">
              Gasto ativo (aparece nos totais e pode ser lançado)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={saving} onClick={handleSave}>
            {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar gasto fixo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
