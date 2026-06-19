import { DriverForm } from "@/components/motoristas/driver-form"
import { PageHeader } from "@/components/shared/page-header"

export default function NovoMotoristaPage() {
  return (
    <div>
      <PageHeader
        title="Novo motorista"
        description="Cadastro operacional e conta de acesso com senha provisória"
      />
      <DriverForm />
    </div>
  )
}
