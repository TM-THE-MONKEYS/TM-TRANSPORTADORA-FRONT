"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import useSWR from "swr"
import {
  BadgePercent,
  CreditCard,
  KeyRound,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { DRIVER_STATUS_LABELS } from "@/lib/motoristas/driver-status"
import type { DriverStatus } from "@/types"

const CNH_CATEGORIES = ["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"] as const

function parseOptionalCommission(val: unknown): number | undefined {
  if (val === "" || val === null || val === undefined) return undefined
  const n = Number(val)
  return Number.isFinite(n) ? n : undefined
}

const commissionField = z.preprocess(
  parseOptionalCommission,
  z.number().min(0, "Mínimo 0%").max(100, "Máximo 100%").optional(),
)

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
  commission_pct: commissionField,
  email: z.string().email("E-mail de login inválido"),
  provisional_password: passwordSchema,
})

const editSchema = createSchema.omit({ email: true, provisional_password: true })

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>
type FormData = CreateFormData | EditFormData

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-sm text-destructive">{message}</p>
}

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
        commission_pct: data.commission_pct,
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

  if (isEdit && isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

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

      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-3xl space-y-6">
        {!isEdit && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            Cadastro operacional e conta de acesso em um único passo. O motorista entra com{" "}
            <span className="font-medium text-foreground">CPF</span> e a senha provisória definida
            abaixo.
          </div>
        )}

        <FormSection
          icon={UserRound}
          title="Dados pessoais"
          description="Identificação e contato do motorista"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="Nome do motorista" {...register("name")} />
              <FieldError message={errors.name?.message} />
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
              <FieldError message={errors.cpf?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  className="pl-9"
                  placeholder="(11) 99999-9999"
                  {...register("phone")}
                />
              </div>
            </div>
          </div>
        </FormSection>

        {!isEdit && (
          <FormSection
            icon={KeyRound}
            title="Acesso ao sistema"
            description="Credenciais para o primeiro login do motorista"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">E-mail de login</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-9"
                    placeholder="motorista@empresa.com.br"
                    {...register("email")}
                  />
                </div>
                {"email" in errors && <FieldError message={errors.email?.message} />}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="provisional_password">Senha provisória</Label>
                <div className="flex gap-2">
                  <Input
                    id="provisional_password"
                    type="text"
                    className="font-mono"
                    {...register("provisional_password")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleGeneratePassword}
                    aria-label="Gerar senha"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                {"provisional_password" in errors && (
                  <FieldError message={errors.provisional_password?.message} />
                )}
                <p className="text-xs text-muted-foreground">
                  Mínimo 8 caracteres, 1 maiúscula e 1 número. Login com CPF + esta senha.
                </p>
              </div>
            </div>
          </FormSection>
        )}

        <FormSection
          icon={CreditCard}
          title="CNH e habilitação"
          description="Documentação obrigatória para operação"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cnh_number">Número da CNH</Label>
              <Input id="cnh_number" inputMode="numeric" {...register("cnh_number")} />
              <FieldError message={errors.cnh_number?.message} />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
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

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cnh_expires_at">Validade da CNH</Label>
              <Input id="cnh_expires_at" type="date" {...register("cnh_expires_at")} />
              <FieldError message={errors.cnh_expires_at?.message} />
            </div>
          </div>
        </FormSection>

        <FormSection
          icon={BadgePercent}
          title="Remuneração e status"
          description="Comissão sobre fretes e situação operacional"
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
              <FieldError message={errors.commission_pct?.message} />
              <p className="text-xs text-muted-foreground">
                Percentual aplicado nos fretes deste motorista. Deixe em branco se não houver comissão.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", v as DriverStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DRIVER_STATUS_LABELS) as DriverStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {DRIVER_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FormSection>

        <div className="sticky bottom-0 z-10 -mx-1 flex flex-col-reverse gap-2 rounded-xl border border-border/60 bg-background/95 p-4 backdrop-blur sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="sm:min-w-40">
            <Shield className="mr-2 h-4 w-4" />
            {isSubmitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar motorista"}
          </Button>
        </div>
      </form>
    </>
  )
}
