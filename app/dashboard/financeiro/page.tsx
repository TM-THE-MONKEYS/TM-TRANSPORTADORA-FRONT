import { Suspense } from "react"
import { FinanceView } from "@/components/financeiro/finance-view"

export default function FinanceiroPage() {
  return (
    <Suspense fallback={null}>
      <FinanceView />
    </Suspense>
  )
}
