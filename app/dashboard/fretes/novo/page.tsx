import { PageHeader } from "@/components/shared/page-header"
import { FreightForm } from "@/components/fretes/freight-form"

export default function NovoFretePage() {
  return (
    <div>
      <PageHeader
        title="Nova ordem de frete"
        description="Cadastro de cotação / ordem"
        density="compact"
      />
      <FreightForm />
    </div>
  )
}
