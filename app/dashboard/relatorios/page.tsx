import { Suspense } from "react"
import { ReportsView } from "@/components/relatorios/reports-view"

export default function RelatoriosPage() {
  return (
    <Suspense fallback={null}>
      <ReportsView />
    </Suspense>
  )
}
