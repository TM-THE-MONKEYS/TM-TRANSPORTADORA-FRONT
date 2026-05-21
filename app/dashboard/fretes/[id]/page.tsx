import { FreightDetailView } from "@/components/fretes/freight-detail-view"

export default async function FreteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <FreightDetailView id={id} />
}
