import { Suspense } from "react"
import { FleetListView } from "@/components/frota/fleet-list-view"

export default function FrotaPage() {
  return (
    <Suspense fallback={null}>
      <FleetListView />
    </Suspense>
  )
}
