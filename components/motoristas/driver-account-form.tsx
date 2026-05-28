"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { AutofillGuardInput } from "@/components/auth/autofill-guard-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/providers/auth-provider"
import { ApiError } from "@/lib/api/errors"
import { listDrivers, updateDriver } from "@/lib/api/services/drivers"
import { createUser } from "@/lib/api/services/users"
import { isAdminRole } from "@/lib/rbac/permissions"

const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Precisa de uma letra maiúscula")
  .regex(/[0-9]/, "Precisa de um número")

const schema = z
  .object({
    driver_id: z.string().min(1, "Selecione o motorista"),
    nome: z.string().min(2, "Informe o nome"),
    email: z.string().email("E-mail inválido"),
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "As senhas não coincidem",
    path: ["confirm_password"],
  })

type FormData = z.infer<typeof schema>

export function DriverAccountForm() {
  const { user, isReady } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { data, isLoading } = useSWR("drivers-for-account", () => listDrivers(1, 100))

  const availableDrivers = useMemo(
    () => (data?.items ?? []).filter((d) => !d.user_id),
    [data?.items],
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const driverId = watch("driver_id")

  useEffect(() => {
    if (!isReady) return
    if (!user || !isAdminRole(user.role)) {
      router.replace("/dashboard/motoristas")
    }
  }, [isReady, user, router])

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const created = await createUser({
        nome: data.nome,
        email: data.email,
        password: data.password,
        role: "motorista",
        is_active: true,
        driver_id: data.driver_id,
      })

      try {
        await updateDriver(data.driver_id, {
          user_id: created.id,
          email: data.email.trim().toLowerCase(),
        })
        toast.success("Conta de motorista criada e vinculada")
        router.push("/dashboard/motoristas")
      } catch (linkError) {
        toast.error(
          linkError instanceof Error
            ? `Conta criada, mas falha ao vincular motorista: ${linkError.message}`
            : "Conta criada, mas falha ao vincular motorista. Vincule manualmente.",
        )
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error("E-mail já cadastrado")
      } else {
        toast.error(e instanceof Error ? e.message : "Erro ao criar conta")
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isReady || !user || !isAdminRole(user.role)) {
    return <Skeleton className="mx-auto h-64 max-w-lg" />
  }

  if (isLoading) {
    return <Skeleton className="mx-auto h-64 max-w-lg" />
  }

  if (availableDrivers.length === 0) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Nenhum motorista disponível</CardTitle>
          <CardDescription>
            Todos os motoristas já possuem conta de acesso ou ainda não há cadastros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/motoristas/novo">Cadastrar motorista</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Conta de acesso</CardTitle>
        <CardDescription>
          Cria login com perfil motorista e vincula ao cadastro operacional selecionado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
          <div className="space-y-2">
            <Label htmlFor="driver_id">Motorista</Label>
            <Select
              value={driverId || undefined}
              onValueChange={(value) => setValue("driver_id", value, { shouldValidate: true })}
            >
              <SelectTrigger id="driver_id">
                <SelectValue placeholder="Selecione o motorista" />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name}
                    {driver.cpf ? ` · ${driver.cpf}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.driver_id && (
              <p className="text-sm text-destructive">{errors.driver_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <AutofillGuardInput id="nome" autoComplete="off" {...register("nome")} />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail de login</Label>
            <AutofillGuardInput
              id="email"
              type="email"
              autoComplete="off"
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <AutofillGuardInput
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres, 1 maiúscula e 1 número.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirmar senha</Label>
            <AutofillGuardInput
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              {...register("confirm_password")}
            />
            {errors.confirm_password && (
              <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar conta"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/motoristas">Cancelar</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
