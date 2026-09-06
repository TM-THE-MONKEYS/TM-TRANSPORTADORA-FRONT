import { Suspense } from "react"
import { FreightsListView } from "@/components/fretes/freights-list-view"

export default function FretesPage() {
  return (
    <Suspense fallback={null}>
      <FreightsListView />
    </Suspense>
  )
}
