"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import useSWR from "swr"
import { RefreshCw } from "lucide-react"
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
import { ProvisionalPasswordDialog } from "@/components/motoristas/provisional-password-dialog"
import { getDriver, updateDriver } from "@/lib/api/services/drivers"
import { generateProvisionalPassword, passwordSchema } from "@/lib/auth/password-policy"
import { formatCpf, isValidCpfLength, stripCpf } from "@/lib/format/cpf"
import { createDriverWithAccount } from "@/lib/motoristas/create-driver-account"
import { formatDriverSaveError } from "@/lib/motoristas/driver-errors"
import type { DriverStatus } from "@/types"

const CNH_CATEGORIES = ["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"] as const

const createSchema = z.object({
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
  commission_pct: z.coerce
    .number()
    .min(0, "Mínimo 0%")
    .max(100, "Máximo 100%")
    .optional()
    .nullable(),
  email: z.string().email("E-mail de login inválido"),
  provisional_password: passwordSchema,
})

const editSchema = createSchema.omit({ email: true, provisional_password: true })

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>
type FormData = CreateFormData | EditFormData

export function DriverForm({ driverId }: { driverId?: string }) {
  const router = useRouter()
  const isEdit = Boolean(driverId)
  const [credentials, setCredentials] = useState<{ cpf: string; email: string; password: string } | null>(null)
  const [createdDriverId, setCreatedDriverId] = useState<string | null>(null)
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
  } = useForm<CreateFormData>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: {
      status: "ativo",
      cnh_category: "E",
      provisional_password: generateProvisionalPassword(),
    },
  })

  useEffect(() => {
    if (!driver) return
    reset({
      name: driver.name,
      cpf: driver.cpf ? formatCpf(driver.cpf) : "",
      cnh_number: driver.cnh_number,
      cnh_category: driver.cnh_category as CreateFormData["cnh_category"],
      cnh_expires_at: driver.cnh_expires_at?.slice(0, 10) ?? "",
      status: driver.status,
      phone: driver.phone ?? "",
      commission_pct: driver.commission_pct ?? undefined,
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
        commission_pct: data.commission_pct ?? undefined,
      }

      if (isEdit && driverId) {
        await updateDriver(driverId, payload)
        toast.success("Motorista atualizado")
        router.push(`/dashboard/motoristas/${driverId}`)
        return
      }

      const createData = data as CreateFormData
      const result = await createDriverWithAccount({
        driver: payload,
        email: createData.email,
        provisionalPassword: createData.provisional_password,
      })

      setCredentials({
        cpf: formatCpf(createData.cpf),
        email: createData.email.trim().toLowerCase(),
        password: result.provisionalPassword,
      })
      setCreatedDriverId(result.driver.id)
    } catch (e) {
      toast.error(formatDriverSaveError(e))
    }
  }

  function handleGeneratePassword() {
    setValue("provisional_password", generateProvisionalPassword(), { shouldValidate: true })
  }

  const cpfValue = watch("cpf") ?? ""

  if (isEdit && isLoading) return <Skeleton className="mx-auto h-64 max-w-lg" />

  return (
    <>
      <ProvisionalPasswordDialog
        open={!!credentials}
        cpf={credentials?.cpf ?? ""}
        email={credentials?.email ?? ""}
        password={credentials?.password ?? ""}
        onClose={() => {
          setCredentials(null)
          if (createdDriverId) router.push(`/dashboard/motoristas/${createdDriverId}`)
        }}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-lg space-y-4">
        {!isEdit && (
          <div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
            Cadastro operacional e conta de acesso em um único passo. Defina o e-mail e a senha
            provisória — o motorista entra na aplicação com essas credenciais.
          </div>
        )}

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

        {!isEdit && (
          <>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail de login</Label>
              <Input id="email" type="email" placeholder="motorista@empresa.com.br" {...register("email")} />
              {"email" in errors && errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="provisional_password">Senha provisória</Label>
              <div className="flex gap-2">
                <Input
                  id="provisional_password"
                  type="text"
                  className="font-mono"
                  {...register("provisional_password")}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleGeneratePassword} aria-label="Gerar senha">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {"provisional_password" in errors && errors.provisional_password && (
                <p className="text-sm text-destructive">{errors.provisional_password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres, 1 maiúscula e 1 número. No login, o motorista usa o CPF e esta
              senha provisória.
              </p>
            </div>
          </>
        )}

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
                setValue("cnh_category", v as CreateFormData["cnh_category"], { shouldValidate: true })
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
          <Label htmlFor="commission_pct">Comissão (%)</Label>
          <div className="relative">
            <Input
              id="commission_pct"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step={0.1}
              placeholder="Ex: 8"
              className="pr-8"
              {...register("commission_pct")}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
          {errors.commission_pct && (
            <p className="text-sm text-destructive">{errors.commission_pct.message}</p>
          )}
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
            {isSubmitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar motorista"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </>
  )
}
