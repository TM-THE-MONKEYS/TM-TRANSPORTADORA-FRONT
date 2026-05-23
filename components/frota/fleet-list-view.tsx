"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Pencil, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { listTrucks, deleteTruck } from "@/lib/api/services/fleet"
import { formatDateBR } from "@/lib/format/dates"
import { findActiveFreightByTruck } from "@/lib/freight/active-trip"
import { getEffectiveTruckStatus, TRUCK_STATUS_LABELS } from "@/lib/fleet/truck-availability"
import { ActiveTripLink } from "@/components/shared/active-trip-link"
import { useOperationContext } from "@/hooks/use-operation-context"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"

export function FleetListView() {
  const router = useRouter()
  const canWrite = usePermission(PERMISSIONS.fleetWrite)
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { freights } = useOperationContext()
  const queryKey = useMemo(() => ["trucks", search] as const, [search])
  const { data, isLoading } = useSWR(queryKey, () => listTrucks(1, 50, search || undefined))

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteTruck(deleteId)
      toast.success("Caminhão excluído")
      await mutate((key) => Array.isArray(key) && key[0] === "trucks")
      setDeleteId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Gestão de frota"
        description="Caminhões, documentação e disponibilidade"
        actions={
          canWrite && (
            <Button asChild>
              <Link href="/dashboard/frota/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo caminhão
              </Link>
            </Button>
          )
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por placa ou modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !data?.items.length ? (
        <EmptyState
          title={search ? "Nenhum resultado" : "Frota vazia"}
          description={
            search ? "Tente outra placa ou modelo." : "Cadastre o primeiro caminhão."
          }
          actionLabel={!search && canWrite ? "Novo caminhão" : undefined}
          onAction={!search && canWrite ? () => router.push("/dashboard/frota/novo") : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.items.map((t) => {
            const effectiveStatus = getEffectiveTruckStatus(t, freights)
            return (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/dashboard/frota/${t.id}`} className="text-lg font-semibold hover:underline">
                      {t.plate}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {t.brand} {t.model} · {t.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={effectiveStatus === "disponivel" ? "success" : "secondary"}>
                      {TRUCK_STATUS_LABELS[effectiveStatus] ?? effectiveStatus}
                    </Badge>
                    {canWrite && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild aria-label="Editar">
                          <Link href={`/dashboard/frota/${t.id}/editar`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Excluir"
                          onClick={() => setDeleteId(t.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm">{t.mileage_km.toLocaleString("pt-BR")} km</p>
                <ActiveTripLink freight={findActiveFreightByTruck(freights, t.id)} />
                {t.license_expires_at && (
                  <p className="text-xs text-muted-foreground">
                    Licenciamento: {formatDateBR(t.license_expires_at)}
                  </p>
                )}
              </CardContent>
            </Card>
          )})}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir caminhão?"
        description="O registro será removido da frota. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
