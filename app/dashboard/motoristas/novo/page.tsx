import { PageHeader } from "@/components/shared/page-header"
import { DriverForm } from "@/components/motoristas/driver-form"

export default function NovoMotoristaPage() {
  return (
    <div>
      <PageHeader title="Novo motorista" />
      <DriverForm />
    </div>
  )
}
