import { PageHeader } from "@/components/shared/page-header"
import { FreightForm } from "@/components/fretes/freight-form"
import { FreightNovoGuard } from "@/components/fretes/freight-novo-guard"

export default function NovoFretePage() {
  return (
    <FreightNovoGuard>
      <div>
        <PageHeader
          title="Nova ordem de frete"
          description="Cadastro de cotação / ordem"
          density="compact"
        />
        <FreightForm />
      </div>
    </FreightNovoGuard>
  )
}
