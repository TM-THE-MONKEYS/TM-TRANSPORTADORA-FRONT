import { Suspense } from "react"
import { FuelView } from "@/components/abastecimento/fuel-view"

export default function AbastecimentoPage() {
  return (
    <Suspense fallback={null}>
      <FuelView />
    </Suspense>
  )
}
