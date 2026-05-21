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
import { createFreight, listCustomers } from "@/lib/api/services/freight"
import useSWR from "swr"
import { useTenant } from "@/components/providers/tenant-provider"

const schema = z.object({
  customer_id: z.string().min(1),
  origin_city: z.string().min(2),
  origin_state: z.string().length(2),
  destination_city: z.string().min(2),
  destination_state: z.string().length(2),
  cargo_description: z.string().min(2),
  weight_kg: z.coerce.number().positive(),
  value_brl: z.coerce.number().nonnegative(),
  freight_type: z.string().min(1),
  deadline_at: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function FreightForm() {
  const router = useRouter()
  const { branchId } = useTenant()
  const { data: customers } = useSWR("customers", listCustomers)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { freight_type: "carga_geral", origin_state: "SP", destination_state: "SP" },
  })

  async function onSubmit(data: FormData) {
    try {
      const freight = await createFreight({
        ...data,
        branch_id: branchId ?? undefined,
        status: "orcamento",
      })
      toast.success("Ordem de frete criada")
      router.push(`/dashboard/fretes/${freight.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar frete")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label>Cliente</Label>
        <Select value={watch("customer_id")} onValueChange={(v) => setValue("customer_id", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(customers ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.customer_id && <p className="text-sm text-destructive">{errors.customer_id.message}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Cidade origem</Label>
          <Input {...register("origin_city")} />
        </div>
        <div className="space-y-2">
          <Label>UF origem</Label>
          <Input maxLength={2} {...register("origin_state")} />
        </div>
        <div className="space-y-2">
          <Label>Cidade destino</Label>
          <Input {...register("destination_city")} />
        </div>
        <div className="space-y-2">
          <Label>UF destino</Label>
          <Input maxLength={2} {...register("destination_state")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Carga</Label>
        <Input {...register("cargo_description")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Peso (kg)</Label>
          <Input type="number" {...register("weight_kg")} />
        </div>
        <div className="space-y-2">
          <Label>Valor (R$)</Label>
          <Input type="number" step="0.01" {...register("value_brl")} />
        </div>
        <div className="space-y-2">
          <Label>Prazo</Label>
          <Input type="date" {...register("deadline_at")} />
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Criar ordem"}
      </Button>
    </form>
  )
}
