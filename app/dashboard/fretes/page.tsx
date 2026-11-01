import { Suspense } from "react"
import { FretesPageClient } from "@/components/fretes/fretes-page-client"

export default function FretesPage() {
  return (
    <Suspense fallback={null}>
      <FretesPageClient />
    </Suspense>
  )
}
