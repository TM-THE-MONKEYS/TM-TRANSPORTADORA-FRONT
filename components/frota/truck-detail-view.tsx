"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { TruckImplementsPanel } from "@/components/frota/truck-implements-panel"
import { getTruck, deleteTruck } from "@/lib/api/services/fleet"
import { formatDateBR } from "@/lib/format/dates"
import { findActiveFreightByTruck } from "@/lib/freight/active-trip"
import { getEffectiveTruckStatus, TRUCK_STATUS_LABELS } from "@/lib/fleet/truck-availability"
import { ActiveTripLink } from "@/components/shared/active-trip-link"
import { useOperationContext } from "@/hooks/use-operation-context"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"

export function TruckDetailView({ id }: { id: string }) {
  const router = useRouter()
  const canWrite = usePermission(PERMISSIONS.fleetWrite)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { freights } = useOperationContext()
  const { data: truck } = useSWR(["truck", id], () => getTruck(id))
  const activeTrip = truck ? findActiveFreightByTruck(freights, truck.id) : undefined
  const effectiveStatus = truck ? getEffectiveTruckStatus(truck, freights) : null

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteTruck(id)
      toast.success("Caminhão excluído")
      router.push("/dashboard/frota")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir")
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (!truck) return <Skeleton className="h-96 w-full" />

  return (
    <div>
      <PageHeader
        title={truck.plate}
        description={`${truck.brand} ${truck.model}`}
        actions={
          canWrite && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/dashboard/frota/${id}/editar`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
              <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </div>
          )
        }
      />
      {activeTrip && (
        <div className="mb-4">
          <ActiveTripLink freight={activeTrip} />
        </div>
      )}

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="documentacao">Documentação</TabsTrigger>
          <TabsTrigger value="implementos">Implementos</TabsTrigger>
        </TabsList>
        <TabsContent value="dados" className="mt-4">
          <Card>
            <CardContent className="grid gap-2 pt-6 sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                {effectiveStatus ? TRUCK_STATUS_LABELS[effectiveStatus] : "—"}
                {effectiveStatus && truck.status !== effectiveStatus && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (cadastro: {TRUCK_STATUS_LABELS[truck.status] ?? truck.status})
                  </span>
                )}
              </p>
              <p><span className="text-muted-foreground">Km:</span> {truck.mileage_km.toLocaleString("pt-BR")}</p>
              <p><span className="text-muted-foreground">Capacidade:</span> {truck.capacity_kg ?? "—"} kg</p>
              <p><span className="text-muted-foreground">Consumo médio:</span> {truck.avg_consumption_km_l ?? "—"} km/l</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documentacao" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-2">
              <p>Seguro: {formatDateBR(truck.insurance_expires_at)}</p>
              <p>Licenciamento: {formatDateBR(truck.license_expires_at)}</p>
              <p className="text-xs text-muted-foreground">Renavam: {truck.renavam ?? "—"}</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="implementos" className="mt-4">
          <TruckImplementsPanel truckId={id} canWrite={canWrite} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir caminhão?"
        description="O registro será removido da frota."
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
