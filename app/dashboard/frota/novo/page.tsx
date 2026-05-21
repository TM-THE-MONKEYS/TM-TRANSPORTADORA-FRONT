import { PageHeader } from "@/components/shared/page-header"
import { TruckForm } from "@/components/frota/truck-form"

export default function NovoCaminhaoPage() {
  return (
    <div>
      <PageHeader title="Novo caminhão" />
      <TruckForm />
    </div>
  )
}
