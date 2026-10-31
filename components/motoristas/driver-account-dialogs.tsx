"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { generateProvisionalPassword, passwordSchema } from "@/lib/auth/password-policy"
import { createAccountForDriver } from "@/lib/motoristas/create-driver-account"
import { resetDriverPassword } from "@/lib/api/services/drivers"
import { formatDriverSaveError } from "@/lib/motoristas/driver-errors"
import type { Driver } from "@/types"

const createAccountSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: passwordSchema,
})

const resetPasswordSchema = z.object({
  password: passwordSchema,
})

type CreateAccountForm = z.infer<typeof createAccountSchema>
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

type CreateAccountDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  driverId: string
  onCreated: (result: { driver: Driver; email: string; password: string }) => void
}

export function CreateDriverAccountDialog({
  open,
  onOpenChange,
  driverId,
  onCreated,
}: CreateAccountDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountForm>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      email: "",
      password: generateProvisionalPassword(),
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      email: "",
      password: generateProvisionalPassword(),
    })
  }, [open, reset])

  async function onSubmit(data: CreateAccountForm) {
    try {
      const result = await createAccountForDriver(driverId, data.email, data.password)
      onOpenChange(false)
      onCreated({
        driver: result.driver,
        email: data.email.trim().toLowerCase(),
        password: result.provisionalPassword,
      })
    } catch (e) {
      toast.error(formatDriverSaveError(e))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar conta de acesso</DialogTitle>
          <DialogDescription>
            O motorista entra com CPF e a senha provisória. O e-mail fica para cadastro e
            recuperação.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-email">E-mail de login</Label>
            <Input
              id="account-email"
              type="email"
              placeholder="motorista@empresa.com.br"
              autoComplete="off"
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-password">Senha provisória</Label>
            <div className="flex gap-2">
              <Input
                id="account-password"
                type="text"
                className="font-mono"
                autoComplete="new-password"
                {...register("password")}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Gerar senha"
                onClick={() =>
                  setValue("password", generateProvisionalPassword(), { shouldValidate: true })
                }
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres, 1 maiúscula e 1 número.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type ResetPasswordDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  driverId: string
  onReset: (password: string) => void
}

export function ResetDriverPasswordDialog({
  open,
  onOpenChange,
  driverId,
  onReset,
}: ResetPasswordDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: generateProvisionalPassword(),
    },
  })

  useEffect(() => {
    if (!open) return
    reset({ password: generateProvisionalPassword() })
  }, [open, reset])

  async function onSubmit(data: ResetPasswordForm) {
    try {
      await resetDriverPassword(driverId, { password: data.password })
      onOpenChange(false)
      onReset(data.password)
      toast.success("Senha redefinida")
    } catch (e) {
      toast.error(formatDriverSaveError(e))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redefinir senha</DialogTitle>
          <DialogDescription>
            Defina uma nova senha provisória e repasse ao motorista. Sessões atuais serão
            invalidadas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-password">Nova senha provisória</Label>
            <div className="flex gap-2">
              <Input
                id="reset-password"
                type="text"
                className="font-mono"
                autoComplete="new-password"
                {...register("password")}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Gerar senha"
                onClick={() =>
                  setValue("password", generateProvisionalPassword(), { shouldValidate: true })
                }
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Redefinir senha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
