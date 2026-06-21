"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { mutate } from "swr"
import { BadgePercent, Calendar, IdCard, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { listDrivers } from "@/lib/api/services/drivers"
import { deleteDriverWithAccount } from "@/lib/motoristas/delete-driver-account"
import {
  DRIVER_STATUS_LABELS,
  DRIVER_STATUS_VARIANT,
  driverInitials,
  formatCommissionPct,
} from "@/lib/motoristas/driver-status"
import { formatDateBR } from "@/lib/format/dates"
import { findActiveFreightByDriver } from "@/lib/freight/active-trip"
import { ActiveTripLink } from "@/components/shared/active-trip-link"
import { useOperationContext } from "@/hooks/use-operation-context"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import type { Driver, DriverStatus } from "@/types"

function DriverCard({
  driver,
  canWrite,
  onDelete,
}: {
  driver: Driver
  canWrite: boolean
  onDelete: (id: string) => void
}) {
  const { freights } = useOperationContext()
  const activeTrip = findActiveFreightByDriver(freights, driver.id)
  const status = driver.status as DriverStatus

  return (
    <Card className="group overflow-hidden border-border/60 transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div className="flex w-16 shrink-0 items-center justify-center bg-primary/10 text-sm font-semibold text-primary">
            {driverInitials(driver.name)}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/motoristas/${driver.id}`}
                  className="truncate text-base font-semibold hover:text-primary hover:underline"
                >
                  {driver.name}
                </Link>
                <Badge variant={DRIVER_STATUS_VARIANT[status]}>{DRIVER_STATUS_LABELS[status]}</Badge>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <IdCard className="h-3.5 w-3.5" />
                  CNH {driver.cnh_category} · {driver.cnh_number}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Validade {formatDateBR(driver.cnh_expires_at)}
                </span>
                {driver.commission_pct != null && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80">
                    <BadgePercent className="h-3.5 w-3.5" />
                    Comissão {formatCommissionPct(driver.commission_pct)}
                  </span>
                )}
              </div>

              <ActiveTripLink freight={activeTrip} />
            </div>

            {canWrite && (
              <div className="flex shrink-0 gap-1 self-start sm:self-center">
                <Button variant="ghost" size="icon" asChild aria-label="Editar">
                  <Link href={`/dashboard/motoristas/${driver.id}/editar`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Excluir"
                  onClick={() => onDelete(driver.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DriversListView() {
  const router = useRouter()
  const canWrite = usePermission(PERMISSIONS.driversWrite)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { data, isLoading } = useSWR("drivers", () => listDrivers(1, 50))

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteDriverWithAccount(deleteId)
      toast.success("Motorista excluído")
      await mutate("drivers")
      setDeleteId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Motoristas"
        description="Gestão de CNH, comissões e contas de acesso"
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/dashboard/motoristas/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo motorista
              </Link>
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          title="Sem motoristas"
          description="Cadastre motoristas da frota com CNH, comissão e acesso ao app."
          actionLabel="Novo motorista"
          onAction={() => router.push("/dashboard/motoristas/novo")}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.items.map((d) => (
            <DriverCard key={d.id} driver={d} canWrite={canWrite} onDelete={setDeleteId} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir motorista?"
        description="O registro será removido. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
