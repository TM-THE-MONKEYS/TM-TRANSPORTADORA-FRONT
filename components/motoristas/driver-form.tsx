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
import { createDriver, getDriver, updateDriver } from "@/lib/api/services/drivers"
import { formatCpf, isValidCpfLength, stripCpf } from "@/lib/format/cpf"
import type { DriverStatus } from "@/types"

const CNH_CATEGORIES = ["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"] as const

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .refine(isValidCpfLength, "CPF deve ter 11 dígitos"),
  cnh_number: z.string().min(9, "CNH inválida"),
  cnh_category: z.enum(CNH_CATEGORIES),
  cnh_expires_at: z.string().min(1, "Informe a validade da CNH"),
  status: z.enum(["ativo", "inativo", "suspenso", "ferias"]),
  phone: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function DriverForm({ driverId }: { driverId?: string }) {
  const router = useRouter()
  const isEdit = Boolean(driverId)
  const { data: driver, isLoading } = useSWR(
    driverId ? ["driver", driverId] : null,
    () => getDriver(driverId!),
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
    defaultValues: { status: "ativo", cnh_category: "E" },
  })

  useEffect(() => {
    if (!driver) return
    reset({
      name: driver.name,
      cpf: driver.cpf ? formatCpf(driver.cpf) : "",
      cnh_number: driver.cnh_number,
      cnh_category: driver.cnh_category as FormData["cnh_category"],
      cnh_expires_at: driver.cnh_expires_at?.slice(0, 10) ?? "",
      status: driver.status,
      phone: driver.phone ?? "",
    })
  }, [driver, reset])

  async function onSubmit(data: FormData) {
    try {
      const payload = {
        name: data.name,
        cpf: stripCpf(data.cpf),
        cnh_number: data.cnh_number.trim(),
        cnh_category: data.cnh_category,
        cnh_expires_at: data.cnh_expires_at,
        status: data.status,
        phone: data.phone?.trim() || undefined,
        photo_url: null,
      }
      if (isEdit && driverId) {
        await updateDriver(driverId, payload)
        toast.success("Motorista atualizado")
        router.push(`/dashboard/motoristas/${driverId}`)
      } else {
        const created = await createDriver(payload)
        toast.success("Motorista cadastrado")
        router.push(`/dashboard/motoristas/${created.id}`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar motorista")
    }
  }

  const cpfValue = watch("cpf") ?? ""

  if (isEdit && isLoading) return <Skeleton className="mx-auto h-64 max-w-lg" />

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={cpfValue}
          onChange={(e) => setValue("cpf", formatCpf(e.target.value), { shouldValidate: true })}
          disabled={isEdit}
        />
        {errors.cpf && <p className="text-sm text-destructive">{errors.cpf.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cnh_number">Número da CNH</Label>
          <Input id="cnh_number" inputMode="numeric" {...register("cnh_number")} />
          {errors.cnh_number && (
            <p className="text-sm text-destructive">{errors.cnh_number.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Categoria CNH</Label>
          <Select
            value={watch("cnh_category")}
            onValueChange={(v) =>
              setValue("cnh_category", v as FormData["cnh_category"], { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CNH_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cnh_expires_at">Validade CNH</Label>
        <Input id="cnh_expires_at" type="date" {...register("cnh_expires_at")} />
        {errors.cnh_expires_at && (
          <p className="text-sm text-destructive">{errors.cnh_expires_at.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone (opcional)</Label>
        <Input id="phone" type="tel" placeholder="(11) 99999-9999" {...register("phone")} />
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={watch("status")} onValueChange={(v) => setValue("status", v as DriverStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
            <SelectItem value="suspenso">Suspenso</SelectItem>
            <SelectItem value="ferias">Férias</SelectItem>
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
