"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Props = {
  open: boolean
  email: string
  password: string
  onClose: () => void
}

export function ProvisionalPasswordDialog({ open, email, password, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conta de acesso criada</DialogTitle>
          <DialogDescription>
            Repasse e-mail e senha provisória ao motorista. A senha não será exibida novamente.
            No primeiro login, ele poderá definir uma senha definitiva ou usar &quot;Esqueci minha
            senha&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>E-mail de login</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={email} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(email)
                  toast.success("E-mail copiado!")
                }}
              >
                Copiar
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Senha provisória</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={password} className="font-mono" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(password)
                  toast.success("Senha copiada!")
                }}
              >
                Copiar
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>Entendi</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
