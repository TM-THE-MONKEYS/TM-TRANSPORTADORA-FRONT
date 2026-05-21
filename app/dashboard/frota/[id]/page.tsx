import { TruckDetailView } from "@/components/frota/truck-detail-view"

export default async function CaminhaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TruckDetailView id={id} />
}
