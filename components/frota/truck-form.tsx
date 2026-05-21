"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTruck } from "@/lib/api/services/fleet"
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

export function TruckForm() {
  const router = useRouter()
  const { branchId } = useTenant()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "disponivel", type: "cavalo", mileage_km: 0 },
  })

  async function onSubmit(data: FormData) {
    try {
      const truck = await createTruck({
        ...data,
        branch_id: branchId ?? undefined,
        avg_consumption_km_l: undefined,
        insurance_expires_at: null,
        license_expires_at: null,
      })
      toast.success("Caminhão cadastrado")
      router.push(`/dashboard/frota/${truck.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-lg space-y-4">
      <div className="space-y-2">
        <Label>Placa</Label>
        <Input {...register("plate")} placeholder="ABC1D23" />
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
      <Button type="submit" disabled={isSubmitting}>
        Salvar
      </Button>
    </form>
  )
}
