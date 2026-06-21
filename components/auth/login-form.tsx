"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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
import { siteConfig } from "@/lib/site-config"
import { syncServerSession } from "@/lib/auth/sync-server-session"
import { getStoredAccessToken } from "@/lib/api/storage"
import { getSafeRedirectPath } from "@/lib/security/safe-redirect"
import { getDefaultHomeRoute } from "@/lib/rbac/permissions"
import { isValidCpfLength } from "@/lib/format/cpf"

const schema = z.object({
  identifier: z
    .string()
    .min(1, "Informe e-mail ou CPF")
    .refine(
      (value) => {
        const trimmed = value.trim()
        if (trimmed.includes("@")) return z.string().email().safeParse(trimmed).success
        return isValidCpfLength(trimmed)
      },
      { message: "Informe um e-mail válido ou CPF com 11 dígitos" },
    ),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

type FormData = z.infer<typeof schema>

export function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const loggedInUser = await login(data)
      const token = getStoredAccessToken()
      if (!token) throw new Error("Sessão não foi gravada no navegador")
      await syncServerSession(token)
      toast.success("Login realizado")

      if (loggedInUser.must_change_password) {
        router.push("/dashboard/conta/alterar-senha")
        return
      }

      router.push(
        getSafeRedirectPath(
          searchParams.get("from"),
          getDefaultHomeRoute(loggedInUser.role, loggedInUser.permissions),
        ),
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/60 shadow-lg">
      <CardHeader className="text-center sm:text-left">
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          Acesse o painel {siteConfig.name}. Administradores: e-mail e senha. Motoristas: CPF e
          senha provisória repassada pelo administrador.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
          <div className="space-y-2">
            <Label htmlFor="login-identifier">E-mail ou CPF</Label>
            <AutofillGuardInput
              id="login-identifier"
              type="text"
              placeholder="admin@empresa.com ou 000.000.000-00"
              autoComplete="username"
              {...register("identifier")}
            />
            {errors.identifier && (
              <p className="text-sm text-destructive">{errors.identifier.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Senha</Label>
            <AutofillGuardInput
              id="login-password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/esqueci-senha" className="text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
