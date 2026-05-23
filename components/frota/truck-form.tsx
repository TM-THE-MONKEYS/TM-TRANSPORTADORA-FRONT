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
  plate: z.string().min(7).max(8),
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().min(1990).max(2030),
  type: z.string().min(1),
  status: z.enum(["disponivel", "em_viagem", "em_manutencao", "inativo"]),
  mileage_km: z.coerce.number().nonnegative(),
  renavam: z.string().optional(),
  capacity_kg: z.coerce.number().optional(),
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
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "disponivel", type: "cavalo", mileage_km: 0 },
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
      mileage_km: truck.mileage_km,
      renavam: truck.renavam ?? "",
      capacity_kg: truck.capacity_kg,
    })
  }, [truck, reset])

  async function onSubmit(data: FormData) {
    try {
      if (isEdit && truckId) {
        await updateTruck(truckId, {
          ...data,
          branch_id: branchId ?? undefined,
        })
        toast.success("Caminhão atualizado")
        router.push(`/dashboard/frota/${truckId}`)
      } else {
        const created = await createTruck({
          ...data,
          branch_id: branchId ?? undefined,
          avg_consumption_km_l: undefined,
          insurance_expires_at: null,
          license_expires_at: null,
        })
        toast.success("Caminhão cadastrado")
        router.push(`/dashboard/frota/${created.id}`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro")
    }
  }

  if (isEdit && isLoading) return <Skeleton className="mx-auto h-64 max-w-lg" />

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-lg space-y-4">
      <div className="space-y-2">
        <Label>Placa</Label>
        <Input {...register("plate")} placeholder="ABC1D23" disabled={isEdit} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Marca</Label>
          <Input {...register("brand")} />
        </div>
        <div className="space-y-2">
          <Label>Modelo</Label>
          <Input {...register("model")} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Ano</Label>
          <Input type="number" {...register("year")} />
        </div>
        <div className="space-y-2">
          <Label>Km atual</Label>
          <Input type="number" {...register("mileage_km")} />
        </div>
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
