import { PageHeader } from "@/components/shared/page-header"
import { TruckForm } from "@/components/frota/truck-form"

export default async function EditarCaminhaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div>
      <PageHeader title="Editar caminhão" />
      <TruckForm truckId={id} />
    </div>
  )
}
