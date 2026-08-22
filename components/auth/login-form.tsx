"use client"

import Link from "next/link"
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
import { isValidCpfLength } from "@/lib/format/cpf"

type LoginFormProps = {
  /** "card" (padrão) = com Card wrapper. "inline" = sem wrapper, integra ao layout pai. */
  variant?: "card" | "inline"
}

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

export function LoginForm({ variant = "card" }: LoginFormProps) {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await login(data)
      toast.success("Login realizado")
      // Navigation is handled by <RedirectIfAuthenticated /> — keep loading=true
      // so the button stays disabled until the page transitions away.
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no login")
      setLoading(false)
    }
  }

  const formContent = (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
        <div className="space-y-2">
          <Label htmlFor="login-identifier">E-mail ou CPF</Label>
          <AutofillGuardInput
            id="login-identifier"
            type="text"
            autoComplete="username"
            className="bg-card"
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
            className="bg-card"
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
    </>
  )

  if (variant === "inline") {
    return <div className="w-full">{formContent}</div>
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
      <CardContent>{formContent}</CardContent>
    </Card>
  )
}
