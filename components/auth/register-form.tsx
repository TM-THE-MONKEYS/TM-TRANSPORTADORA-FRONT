"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { AutofillGuardInput } from "@/components/auth/autofill-guard-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/providers/auth-provider"
import { syncServerSession } from "@/lib/auth/sync-server-session"
import { getStoredAccessToken } from "@/lib/api/storage"
import { siteConfig } from "@/lib/site-config"

const schema = z.object({
  tenant_name: z.string().min(3, "Nome da empresa obrigatório"),
  admin_name: z.string().min(2, "Nome do administrador obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
})

type FormData = z.infer<typeof schema>

export function RegisterForm() {
  const { register: registerUser } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await registerUser(data)
      const token = getStoredAccessToken()
      if (!token) throw new Error("Sessão não foi gravada no navegador")
      await syncServerSession(token)
      toast.success("Conta criada com sucesso")
      router.push("/dashboard")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no cadastro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/60 shadow-lg">
      <CardHeader className="text-center sm:text-left">
        <CardTitle>Cadastrar empresa</CardTitle>
        <CardDescription>
          Crie sua conta em {siteConfig.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
          <div className="space-y-2">
            <Label htmlFor="register-tenant">Nome da empresa</Label>
            <AutofillGuardInput
              id="register-tenant"
              placeholder="Ex.: TSV Transportes Ltda"
              autoComplete="off"
              {...register("tenant_name")}
            />
            {errors.tenant_name && (
              <p className="text-sm text-destructive">{errors.tenant_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-admin">Seu nome</Label>
            <AutofillGuardInput
              id="register-admin"
              placeholder="Nome completo"
              autoComplete="off"
              {...register("admin_name")}
            />
            {errors.admin_name && (
              <p className="text-sm text-destructive">{errors.admin_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-email">E-mail</Label>
            <AutofillGuardInput
              id="register-email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="off"
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">Senha</Label>
            <AutofillGuardInput
              id="register-password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
