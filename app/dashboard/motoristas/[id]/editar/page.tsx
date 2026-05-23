import { PageHeader } from "@/components/shared/page-header"
import { DriverForm } from "@/components/motoristas/driver-form"

export default async function EditarMotoristaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div>
      <PageHeader title="Editar motorista" />
      <DriverForm driverId={id} />
    </div>
  )
}
