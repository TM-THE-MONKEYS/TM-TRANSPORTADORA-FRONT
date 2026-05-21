import { DriverDetailView } from "@/components/motoristas/driver-detail-view"

export default async function MotoristaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DriverDetailView id={id} />
}
