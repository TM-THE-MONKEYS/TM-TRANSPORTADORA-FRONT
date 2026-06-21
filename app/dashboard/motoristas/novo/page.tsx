import { DriverForm } from "@/components/motoristas/driver-form"
import { PageHeader } from "@/components/shared/page-header"

export default function NovoMotoristaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo motorista"
        description="Cadastro completo com CNH, comissão e conta de acesso"
      />
      <DriverForm />
    </div>
  )
}
