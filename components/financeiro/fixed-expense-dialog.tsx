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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  FIXED_EXPENSE_CATEGORIES,
  FREQUENCY_LABELS,
  createFixedExpense,
  updateFixedExpense,
} from "@/lib/api/services/fixed-expenses"
import { cn } from "@/lib/utils"
import type { FixedExpense } from "@/types"

const fxSchema = z
  .object({
    nome: z.string().min(1, "Informe o nome"),
    categoria: z.string().min(1),
    valor: z.string().refine(
      (v) => {
        const n = parseFloat(v.replace(",", "."))
        return !isNaN(n) && n > 0
      },
      { message: "Informe um valor válido e positivo" },
    ),
    frequencia: z.string().min(1),
    dia_vencimento: z.string().optional(),
    duracao_limitada: z.boolean(),
    total_parcelas: z.string().optional(),
    data_inicio: z.string().optional(),
    ativo: z.boolean(),
    observacao: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.duracao_limitada) return true
      const parcelas = Number.parseInt(data.total_parcelas ?? "", 10)
      return !isNaN(parcelas) && parcelas > 0
    },
    { message: "Informe o número de parcelas", path: ["total_parcelas"] },
  )

type FxFormValues = z.infer<typeof fxSchema>

function toFormValues(item: FixedExpense): FxFormValues {
  return {
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
}

interface FixedExpenseDialogProps {
  open: boolean
  item?: FixedExpense
  onOpenChange: (o: boolean) => void
  onSave: () => Promise<void>
}

export function FixedExpenseDialog({
  open,
  item,
  onOpenChange,
  onSave,
}: FixedExpenseDialogProps) {
  const isEdit = Boolean(item)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FxFormValues>({
    resolver: zodResolver(fxSchema),
    defaultValues: {
      nome: "",
      categoria: "Outros",
      valor: "",
      frequencia: "mensal",
      dia_vencimento: "",
      duracao_limitada: false,
      total_parcelas: "",
      data_inicio: new Date().toISOString().slice(0, 10),
      ativo: true,
      observacao: "",
    },
  })

  const duracaoLimitada = watch("duracao_limitada")
  const totalParcelas = watch("total_parcelas")

  useEffect(() => {
    if (!open) return
    if (item) {
      reset(toFormValues(item))
    } else {
      reset({
        nome: "",
        categoria: "Outros",
        valor: "",
        frequencia: "mensal",
        dia_vencimento: "",
        duracao_limitada: false,
        total_parcelas: "",
        data_inicio: new Date().toISOString().slice(0, 10),
        ativo: true,
        observacao: "",
      })
    }
  }, [open, item, reset])

  async function onSubmit(values: FxFormValues) {
    const valor = parseFloat(values.valor.replace(",", "."))
    const total_parcelas = values.duracao_limitada
      ? Number.parseInt(values.total_parcelas ?? "", 10)
      : null

    try {
      const payload = {
        nome: values.nome.trim(),
        categoria: values.categoria,
        valor,
        frequencia: values.frequencia as FixedExpense["frequencia"],
        dia_vencimento: values.dia_vencimento ? Number(values.dia_vencimento) : undefined,
        total_parcelas: total_parcelas ?? null,
        data_inicio: values.duracao_limitada ? values.data_inicio : undefined,
        parcelas_lancadas: item?.parcelas_lancadas ?? 0,
        ativo: values.ativo,
        observacao: values.observacao?.trim() || undefined,
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
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar gasto fixo" : "Novo gasto fixo"}</DialogTitle>
          <DialogDescription>
            Gastos fixos representam despesas recorrentes. Opcionalmente defina parcelas para
            encerrar após X meses.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fx-nome">Nome *</Label>
            <Input
              id="fx-nome"
              placeholder="Ex: Aluguel do galpão"
              {...register("nome")}
              className={cn(errors.nome && "border-destructive")}
            />
            {errors.nome && (
              <p className="text-xs text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fx-categoria">Categoria</Label>
              <Controller
                control={control}
                name="categoria"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="fx-categoria">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIXED_EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fx-frequencia">Recorrência</Label>
              <Controller
                control={control}
                name="frequencia"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="fx-frequencia">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fx-valor">Valor (R$) *</Label>
              <Input
                id="fx-valor"
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
              <Label htmlFor="fx-dia">Dia de vencimento</Label>
              <Input
                id="fx-dia"
                type="number"
                min={1}
                max={31}
                placeholder="Ex: 10"
                {...register("dia_vencimento")}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-3">
              <Controller
                control={control}
                name="duracao_limitada"
                render={({ field }) => (
                  <Checkbox
                    id="fx-duracao"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                )}
              />
              <Label htmlFor="fx-duracao" className="cursor-pointer font-normal">
                Duração limitada (parcelas/meses)
              </Label>
            </div>

            {duracaoLimitada && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fx-parcelas">Nº de parcelas *</Label>
                  <Input
                    id="fx-parcelas"
                    type="number"
                    min={1}
                    max={360}
                    placeholder="Ex: 12"
                    {...register("total_parcelas")}
                    className={cn(errors.total_parcelas && "border-destructive")}
                  />
                  {errors.total_parcelas && (
                    <p className="text-xs text-destructive">
                      {errors.total_parcelas.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fx-inicio">Início da vigência</Label>
                  <Input
                    id="fx-inicio"
                    type="date"
                    {...register("data_inicio")}
                  />
                </div>
              </div>
            )}

            {duracaoLimitada && (
              <p className="text-xs text-muted-foreground">
                Após {totalParcelas || "X"} mês(es), o gasto fixo encerra automaticamente
                {isEdit && item?.parcelas_lancadas
                  ? ` (${item.parcelas_lancadas} parcela(s) já lançada(s)).`
                  : "."}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fx-obs">Observação</Label>
            <Textarea
              id="fx-obs"
              placeholder="Notas adicionais (opcional)"
              {...register("observacao")}
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
            <Controller
              control={control}
              name="ativo"
              render={({ field }) => (
                <Checkbox
                  id="fx-ativo"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <Label htmlFor="fx-ativo" className="cursor-pointer font-normal">
              Gasto ativo (aparece nos totais e pode ser lançado)
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Salvando..."
                : isEdit
                  ? "Salvar alterações"
                  : "Criar gasto fixo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
