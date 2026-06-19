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
import { forgotPassword } from "@/lib/api/services/auth"

const schema = z.object({
  email: z.string().email("E-mail inválido"),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await forgotPassword(data.email)
      setSent(true)
      toast.success("Se o e-mail existir, enviaremos instruções de redefinição")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao solicitar redefinição")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/60 shadow-lg">
      <CardHeader className="text-center sm:text-left">
        <CardTitle>Esqueci minha senha</CardTitle>
        <CardDescription>
          Informe o e-mail da conta. Enviaremos um link para definir uma nova senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Se houver uma conta com esse e-mail, você receberá as instruções em breve. Verifique
              também a caixa de spam.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Voltar ao login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">E-mail</Label>
              <AutofillGuardInput
                id="forgot-email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="off"
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link"}
            </Button>
            <p className="text-center text-sm">
              <Link href="/login" className="text-primary hover:underline">
                Voltar ao login
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
