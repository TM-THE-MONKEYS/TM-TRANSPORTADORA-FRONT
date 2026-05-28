import { DriverAccountForm } from "@/components/motoristas/driver-account-form"
import { PageHeader } from "@/components/shared/page-header"

export default function NovaContaMotoristaPage() {
  return (
    <div>
      <PageHeader
        title="Criar conta de motorista"
        description="Login de acesso vinculado a um motorista já cadastrado"
      />
      <DriverAccountForm />
    </div>
  )
}
