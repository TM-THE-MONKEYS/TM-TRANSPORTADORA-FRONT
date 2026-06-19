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
import { resetPassword } from "@/lib/api/services/auth"
import { passwordSchema } from "@/lib/auth/password-policy"

const schema = z
  .object({
    new_password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "As senhas não coincidem",
    path: ["confirm_password"],
  })

type FormData = z.infer<typeof schema>

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    if (!token) {
      toast.error("Link inválido. Solicite uma nova redefinição de senha.")
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, data.new_password)
      toast.success("Senha redefinida com sucesso")
      router.push("/login")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao redefinir senha")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardHeader>
          <CardTitle>Link inválido</CardTitle>
          <CardDescription>O token de redefinição não foi informado ou expirou.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/esqueci-senha">Solicitar novo link</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-border/60 shadow-lg">
      <CardHeader className="text-center sm:text-left">
        <CardTitle>Nova senha</CardTitle>
        <CardDescription>Defina uma senha definitiva para sua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Redefinir senha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
