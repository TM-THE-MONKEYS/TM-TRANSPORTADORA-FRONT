"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { AutofillGuardInput } from "@/components/auth/autofill-guard-input"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { changePassword } from "@/lib/api/services/auth"
import { passwordSchema } from "@/lib/auth/password-policy"
import { getDefaultHomeRoute } from "@/lib/rbac/permissions"

const schema = z
  .object({
    current_password: z.string().min(1, "Informe a senha atual"),
    new_password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "As senhas não coincidem",
    path: ["confirm_password"],
  })

type FormData = z.infer<typeof schema>

export function ChangePasswordForm() {
  const { user, refreshUser } = useAuth()
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
      await changePassword(data.current_password, data.new_password)
      await refreshUser()
      toast.success("Senha alterada com sucesso")
      if (user) {
        router.push(getDefaultHomeRoute(user.role, user.permissions))
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao alterar senha")
    } finally {
      setLoading(false)
    }
  }

  const isProvisional = user?.must_change_password

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>{isProvisional ? "Defina sua senha" : "Alterar senha"}</CardTitle>
        <CardDescription>
          {isProvisional
            ? "Você entrou com senha provisória. Crie uma senha definitiva para continuar."
            : "Informe a senha atual e escolha uma nova senha."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
          <div className="space-y-2">
            <Label htmlFor="current_password">
              {isProvisional ? "Senha provisória" : "Senha atual"}
            </Label>
            <AutofillGuardInput
              id="current_password"
              type="password"
              autoComplete="current-password"
              {...register("current_password")}
            />
            {errors.current_password && (
              <p className="text-sm text-destructive">{errors.current_password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password">Nova senha</Label>
            <AutofillGuardInput
              id="new_password"
              type="password"
              autoComplete="new-password"
              {...register("new_password")}
            />
            {errors.new_password && (
              <p className="text-sm text-destructive">{errors.new_password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirmar nova senha</Label>
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
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
            {!isProvisional && user && (
              <Button type="button" variant="outline" asChild>
                <Link href={getDefaultHomeRoute(user.role, user.permissions)}>Cancelar</Link>
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
