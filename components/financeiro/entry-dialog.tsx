"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  createFinanceEntry,
  updateFinanceEntry,
} from "@/lib/api/services/finance"
import { FIXED_EXPENSE_CATEGORIES } from "@/lib/api/services/fixed-expenses"
import { competenciaDefaultDate, formatCompetenciaLabel } from "@/lib/format/dates"
import { cn } from "@/lib/utils"
import type { FinanceEntry, FinanceEntryStatus, FinanceEntryType } from "@/types"

const CATEGORY_OTHER = "Outra"

const entrySchema = z
  .object({
    tipo: z.enum(["receita", "despesa"] as const),
    categoriaSelect: z.string().min(1, "Selecione uma categoria"),
    categoriaCustom: z.string().optional(),
    descricao: z.string().optional(),
    valor: z.string().refine(
      (v) => {
        const n = parseFloat(v.replace(",", "."))
        return !isNaN(n) && n > 0
      },
      { message: "Informe um valor válido e positivo" },
    ),
    status: z.enum(["pendente", "pago", "cancelado", "vencido"] as const),
    data_vencimento: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.categoriaSelect === CATEGORY_OTHER) {
        return (data.categoriaCustom ?? "").trim().length > 0
      }
      return true
    },
    { message: "Informe a categoria", path: ["categoriaCustom"] },
  )

type EntryFormValues = z.infer<typeof entrySchema>

function toFormValues(
  entry: FinanceEntry,
): EntryFormValues {
  const inList = (FIXED_EXPENSE_CATEGORIES as readonly string[]).includes(entry.categoria)
  return {
    tipo: entry.tipo,
    categoriaSelect: inList ? entry.categoria : CATEGORY_OTHER,
    categoriaCustom: inList ? "" : entry.categoria,
    descricao: entry.descricao ?? "",
    valor: String(entry.valor),
    status: entry.status,
    data_vencimento: entry.data_vencimento ?? "",
  }
}

interface EntryDialogProps {
  open: boolean
  entry?: FinanceEntry
  competencia: { mes: number; ano: number }
  onOpenChange: (o: boolean) => void
  onSave: () => Promise<void>
}

export function EntryDialog({
  open,
  entry,
  competencia,
  onOpenChange,
  onSave,
}: EntryDialogProps) {
  const isEdit = Boolean(entry)
  const defaultVencimento = competenciaDefaultDate(competencia.mes, competencia.ano)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      tipo: "despesa",
      categoriaSelect: "Outros",
      categoriaCustom: "",
      descricao: "",
      valor: "",
      status: "pendente",
      data_vencimento: defaultVencimento,
    },
  })

  const categoriaSelect = watch("categoriaSelect")

  useEffect(() => {
    if (!open) return
    if (entry) {
      reset(toFormValues(entry))
    } else {
      reset({
        tipo: "despesa",
        categoriaSelect: "Outros",
        categoriaCustom: "",
        descricao: "",
        valor: "",
        status: "pendente",
        data_vencimento: defaultVencimento,
      })
    }
  }, [open, entry, defaultVencimento, reset])

  async function onSubmit(values: EntryFormValues) {
    const categoria =
      values.categoriaSelect === CATEGORY_OTHER
        ? (values.categoriaCustom ?? "").trim()
        : values.categoriaSelect

    const valor = parseFloat(values.valor.replace(",", "."))
    const vencimento =
      values.data_vencimento || (!isEdit ? defaultVencimento : undefined)

    try {
      const payload = {
        tipo: values.tipo,
        categoria,
        descricao: values.descricao?.trim() || undefined,
        valor,
        status: values.status,
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
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Altere os dados do lançamento financeiro."
              : `Registre na competência ${formatCompetenciaLabel(competencia.mes, competencia.ano)}. O vencimento define o mês do lançamento.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fin-tipo">Tipo</Label>
              <Controller
                control={control}
                name="tipo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="fin-tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fin-status">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="fin-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fin-categoria">Categoria *</Label>
            <Controller
              control={control}
              name="categoriaSelect"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="fin-categoria"
                    className={cn(errors.categoriaSelect && "border-destructive")}
                  >
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIXED_EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    <SelectItem value={CATEGORY_OTHER}>Outra</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoriaSelect && (
              <p className="text-xs text-destructive">{errors.categoriaSelect.message}</p>
            )}
            {categoriaSelect === CATEGORY_OTHER && (
              <div className="mt-1.5">
                <Input
                  placeholder="Informe a categoria (ex: Combustível, Pedágio...)"
                  {...register("categoriaCustom")}
                  className={cn(errors.categoriaCustom && "border-destructive")}
                  autoFocus
                />
                {errors.categoriaCustom && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.categoriaCustom.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fin-descricao">Descrição</Label>
            <Input
              id="fin-descricao"
              placeholder="Descrição opcional"
              {...register("descricao")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fin-valor">Valor (R$) *</Label>
              <Input
                id="fin-valor"
                type="number"
                min={0}
                step={0.01}
                placeholder="0,00"
                {...register("valor")}
                className={cn(errors.valor && "border-destructive")}
              />
              {errors.valor && (
                <p className="text-xs text-destructive">{errors.valor.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fin-vencimento">Vencimento</Label>
              <Input
                id="fin-vencimento"
                type="date"
                {...register("data_vencimento")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar lançamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
