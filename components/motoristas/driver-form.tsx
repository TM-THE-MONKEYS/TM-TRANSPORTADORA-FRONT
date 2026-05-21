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
import { createDriver } from "@/lib/api/services/drivers"
import type { DriverStatus } from "@/types"

const schema = z.object({
  name: z.string().min(2),
  cnh_number: z.string().min(5),
  cnh_category: z.string().min(1),
  cnh_expires_at: z.string().min(1),
  status: z.enum(["disponivel", "em_viagem", "folga", "inativo"]),
  phone: z.string().optional(),
  commission_pct: z.coerce.number().optional(),
})

type FormData = z.infer<typeof schema>

export function DriverForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "disponivel", cnh_category: "E" },
  })

  async function onSubmit(data: FormData) {
    try {
      const driver = await createDriver({ ...data, photo_url: null })
      toast.success("Motorista cadastrado")
      router.push(`/dashboard/motoristas/${driver.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-lg space-y-4">
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input {...register("name")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>CNH</Label>
          <Input {...register("cnh_number")} />
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Input {...register("cnh_category")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Validade CNH</Label>
        <Input type="date" {...register("cnh_expires_at")} />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={watch("status")} onValueChange={(v) => setValue("status", v as DriverStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="em_viagem">Em viagem</SelectItem>
            <SelectItem value="folga">Folga</SelectItem>
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
