"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import useSWR from "swr"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
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
import { createTruck, getTruck, updateTruck } from "@/lib/api/services/fleet"
import { useTenant } from "@/components/providers/tenant-provider"
import type { TruckStatus } from "@/types"

const schema = z.object({
  plate: z.string().min(7, "Placa inválida").max(8, "Placa inválida"),
  brand: z.string().min(1, "Informe a marca"),
  model: z.string().min(1, "Informe o modelo"),
  year: z.coerce.number().min(1990, "Ano inválido").max(2030, "Ano inválido"),
  type: z.string().min(1),
  status: z.enum(["disponivel", "em_viagem", "em_manutencao", "inativo"]),
  mileage_km: z.coerce
    .number({ invalid_type_error: "Informe a quilometragem" })
    .positive("Quilometragem deve ser maior que 0"),
  capacity_kg: z.coerce
    .number({ invalid_type_error: "Informe a capacidade" })
    .positive("Capacidade deve ser maior que 0"),
  avg_consumption_km_l: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const n = Number(val)
    return Number.isFinite(n) ? n : undefined
  }, z.number().positive("Consumo deve ser maior que 0").optional()),
  renavam: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function TruckForm({ truckId }: { truckId?: string }) {
  const router = useRouter()
  const { branchId } = useTenant()
  const isEdit = Boolean(truckId)
  const { data: truck, isLoading } = useSWR(
    truckId ? ["truck", truckId] : null,
    () => getTruck(truckId!),
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "disponivel", type: "cavalo" },
  })

  useEffect(() => {
    if (!truck) return
    reset({
      plate: truck.plate,
      brand: truck.brand,
      model: truck.model,
      year: truck.year,
      type: truck.type,
      status: truck.status,
      mileage_km: truck.mileage_km > 0 ? truck.mileage_km : undefined,
      renavam: truck.renavam ?? "",
      capacity_kg: truck.capacity_kg && truck.capacity_kg > 0 ? truck.capacity_kg : undefined,
      avg_consumption_km_l:
        truck.avg_consumption_km_l && truck.avg_consumption_km_l > 0
          ? truck.avg_consumption_km_l
          : undefined,
    })
  }, [truck, reset])

  async function onSubmit(data: FormData) {
    try {
      const payload = {
        plate: data.plate,
        brand: data.brand,
        model: data.model,
        year: data.year,
        type: data.type,
        status: data.status,
        mileage_km: data.mileage_km,
        renavam: data.renavam,
        capacity_kg: data.capacity_kg,
        avg_consumption_km_l:
          typeof data.avg_consumption_km_l === "number" ? data.avg_consumption_km_l : undefined,
        branch_id: branchId ?? undefined,
        insurance_expires_at: null,
        license_expires_at: null,
      }

      if (isEdit && truckId) {
        await updateTruck(truckId, payload)
        toast.success("Caminhão atualizado")
        router.push(`/dashboard/frota/${truckId}`)
      } else {
        const created = await createTruck(payload)
        toast.success("Caminhão cadastrado")
        router.push(`/dashboard/frota/${created.id}`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar caminhão")
    }
  }

  if (isEdit && isLoading) return <Skeleton className="mx-auto h-64 max-w-lg" />

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="plate">Placa</Label>
        <Input id="plate" {...register("plate")} placeholder="ABC1D23" disabled={isEdit} />
        {errors.plate && <p className="text-sm text-destructive">{errors.plate.message}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" {...register("brand")} />
          {errors.brand && <p className="text-sm text-destructive">{errors.brand.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" {...register("model")} />
          {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="year">Ano</Label>
          <Input id="year" type="number" {...register("year")} />
          {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="mileage_km">Km atual</Label>
          <Input id="mileage_km" type="number" min={1} {...register("mileage_km")} placeholder="150000" />
          {errors.mileage_km && (
            <p className="text-sm text-destructive">{errors.mileage_km.message}</p>
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="capacity_kg">Capacidade (kg)</Label>
          <Input id="capacity_kg" type="number" min={1} {...register("capacity_kg")} placeholder="30000" />
          {errors.capacity_kg && (
            <p className="text-sm text-destructive">{errors.capacity_kg.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="avg_consumption_km_l">Consumo médio (km/l)</Label>
          <Input
            id="avg_consumption_km_l"
            type="number"
            step="0.1"
            min={0.1}
            {...register("avg_consumption_km_l")}
            placeholder="2.5"
          />
          {errors.avg_consumption_km_l && (
            <p className="text-sm text-destructive">{errors.avg_consumption_km_l.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Renavam (opcional)</Label>
        <Input {...register("renavam")} />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={watch("status")} onValueChange={(v) => setValue("status", v as TruckStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="em_viagem">Em viagem</SelectItem>
            <SelectItem value="em_manutencao">Manutenção</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Salvar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
