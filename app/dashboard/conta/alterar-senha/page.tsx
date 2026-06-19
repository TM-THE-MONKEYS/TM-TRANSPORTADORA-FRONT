import { ChangePasswordForm } from "@/components/auth/change-password-form"
import { PageHeader } from "@/components/shared/page-header"

export default function AlterarSenhaPage() {
  return (
    <div>
      <PageHeader title="Minha conta" description="Segurança e credenciais de acesso" />
      <ChangePasswordForm />
    </div>
  )
}
