"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { BadgePercent, Container, Pencil, Plus, Ruler, Trash2, Truck } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  createImplement,
  deleteImplement,
  listImplements,
  updateImplement,
} from "@/lib/api/services/fleet"
import { IMPLEMENT_TYPE_LABELS, IMPLEMENT_TYPES } from "@/lib/fleet/implement-types"
import type { ImplementType, TruckImplement } from "@/types"

const optionalDimension = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined
  const n = Number(val)
  return Number.isFinite(n) ? n : undefined
}, z.number().positive("Dimensão inválida").optional())

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  type: z.enum(["carreta", "bau", "tanque", "prancha", "camera_fria"]),
  plate: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  capacity_kg: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const n = Number(val)
    return Number.isFinite(n) ? n : undefined
  }, z.number().positive("Capacidade inválida").optional()),
  length_m: optionalDimension,
  width_m: optionalDimension,
  height_m: optionalDimension,
})

type FormData = z.infer<typeof schema>

function formatCapacity(value?: number | null) {
  if (value == null) return "—"
  return `${value.toLocaleString("pt-BR")} kg`
}

function formatDimension(value: number) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
}

function formatDimensions(item: Pick<TruckImplement, "length_m" | "width_m" | "height_m">) {
  const parts = [item.length_m, item.width_m, item.height_m].filter(
    (v): v is number => v != null && v > 0,
  )
  if (parts.length === 0) return null
  if (parts.length === 3) {
    return `${formatDimension(item.length_m!)} × ${formatDimension(item.width_m!)} × ${formatDimension(item.height_m!)} m`
  }
  return parts.map(formatDimension).join(" × ") + " m"
}

export function TruckImplementsPanel({
  truckId,
  canWrite,
}: {
  truckId: string
  canWrite: boolean
}) {
  const swrKey = ["truck-implements", truckId]
  const { data: implements_, isLoading } = useSWR(swrKey, () => listImplements(truckId))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TruckImplement | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "carreta" },
  })

  function openCreate() {
    setEditing(null)
    reset({
      name: "",
      type: "carreta",
      plate: "",
      brand: "",
      model: "",
      capacity_kg: undefined,
      length_m: undefined,
      width_m: undefined,
      height_m: undefined,
    })
    setDialogOpen(true)
  }

  function openEdit(item: TruckImplement) {
    setEditing(item)
    reset({
      name: item.name,
      type: item.type,
      plate: item.plate ?? "",
      brand: item.brand ?? "",
      model: item.model ?? "",
      capacity_kg: item.capacity_kg ?? undefined,
      length_m: item.length_m ?? undefined,
      width_m: item.width_m ?? undefined,
      height_m: item.height_m ?? undefined,
    })
    setDialogOpen(true)
  }

  async function onSubmit(data: FormData) {
    try {
      const payload = {
        name: data.name,
        type: data.type,
        plate: data.plate?.trim() || undefined,
        brand: data.brand?.trim() || undefined,
        model: data.model?.trim() || undefined,
        capacity_kg: data.capacity_kg,
        length_m: data.length_m,
        width_m: data.width_m,
        height_m: data.height_m,
      }

      if (editing) {
        await updateImplement(truckId, editing.id, payload)
        toast.success("Implemento atualizado")
      } else {
        await createImplement(truckId, payload)
        toast.success("Implemento adicionado")
      }

      await mutate(swrKey)
      setDialogOpen(false)
      setEditing(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar implemento")
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteImplement(truckId, deleteId)
      toast.success("Implemento removido")
      await mutate(swrKey)
      setDeleteId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Container className="h-5 w-5 text-primary" />
              Implementos
            </CardTitle>
            <CardDescription>
              Carretas, baús, câmaras frias e outros acoplados a este cavalo
            </CardDescription>
          </div>
          {canWrite && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full rounded-lg" />
          ) : !implements_?.length ? (
            <div className="rounded-lg border border-dashed py-10 text-center">
              <Truck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Nenhum implemento cadastrado</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Adicione carreta, baú, câmara fria ou tanque com placa e capacidade
              </p>
              {canWrite && (
                <Button variant="outline" size="sm" className="mt-4" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar implemento
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {implements_.map((item) => {
                const dimensions = formatDimensions(item)
                return (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-4"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {IMPLEMENT_TYPE_LABELS[item.type]}
                      {item.plate ? ` · ${item.plate}` : ""}
                    </p>
                    {(item.brand || item.model) && (
                      <p className="text-xs text-muted-foreground">
                        {[item.brand, item.model].filter(Boolean).join(" ")}
                      </p>
                    )}
                    {item.capacity_kg != null && (
                      <p className="inline-flex items-center gap-1 text-xs font-medium">
                        <BadgePercent className="h-3 w-3" />
                        Capacidade {formatCapacity(item.capacity_kg)}
                      </p>
                    )}
                    {dimensions && (
                      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Ruler className="h-3 w-3" />
                        {dimensions} (C × L × A)
                      </p>
                    )}
                  </div>
                  {canWrite && (
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir"
                        onClick={() => setDeleteId(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar implemento" : "Novo implemento"}</DialogTitle>
            <DialogDescription>
              Informe tipo, identificação e especificações do acoplado
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imp-name">Nome</Label>
              <Input id="imp-name" placeholder="Ex: Carreta LS 2022" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={watch("type")}
                  onValueChange={(v) => setValue("type", v as ImplementType, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPLEMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {IMPLEMENT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imp-plate">Placa</Label>
                <Input id="imp-plate" placeholder="ABC1D23" {...register("plate")} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="imp-brand">Marca</Label>
                <Input id="imp-brand" placeholder="Randon" {...register("brand")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imp-model">Modelo</Label>
                <Input id="imp-model" placeholder="SR BAU" {...register("model")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imp-capacity">Capacidade (kg)</Label>
              <Input
                id="imp-capacity"
                type="number"
                min={1}
                step={1}
                placeholder="30000"
                {...register("capacity_kg")}
              />
              {errors.capacity_kg && (
                <p className="text-sm text-destructive">{errors.capacity_kg.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Dimensões úteis (m)</Label>
              <p className="text-xs text-muted-foreground">Comprimento × largura × altura — opcional</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="imp-length" className="text-xs font-normal text-muted-foreground">
                    Comprimento
                  </Label>
                  <Input
                    id="imp-length"
                    type="number"
                    min={0.01}
                    step={0.01}
                    placeholder="14,6"
                    {...register("length_m")}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="imp-width" className="text-xs font-normal text-muted-foreground">
                    Largura
                  </Label>
                  <Input
                    id="imp-width"
                    type="number"
                    min={0.01}
                    step={0.01}
                    placeholder="2,6"
                    {...register("width_m")}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="imp-height" className="text-xs font-normal text-muted-foreground">
                    Altura
                  </Label>
                  <Input
                    id="imp-height"
                    type="number"
                    min={0.01}
                    step={0.01}
                    placeholder="2,8"
                    {...register("height_m")}
                  />
                </div>
              </div>
              {(errors.length_m || errors.width_m || errors.height_m) && (
                <p className="text-sm text-destructive">
                  {errors.length_m?.message ?? errors.width_m?.message ?? errors.height_m?.message}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : editing ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remover implemento?"
        description="O registro será excluído deste caminhão."
        confirmLabel="Remover"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
