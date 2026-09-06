import { Suspense } from "react"
import { DriversListView } from "@/components/motoristas/drivers-list-view"

export default function MotoristasPage() {
  return (
    <Suspense fallback={null}>
      <DriversListView />
    </Suspense>
  )
}
