import { PageHeader } from "@/components/shared/page-header"
import { DriverForm } from "@/components/motoristas/driver-form"

export default async function EditarMotoristaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar motorista"
        description="Atualize dados operacionais, comissão e status"
      />
      <DriverForm driverId={id} />
    </div>
  )
}
