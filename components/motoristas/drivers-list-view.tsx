"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { mutate } from "swr"
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useAuth } from "@/components/providers/auth-provider"
import { listDrivers, deleteDriver } from "@/lib/api/services/drivers"
import { formatDateBR } from "@/lib/format/dates"
import { findActiveFreightByDriver } from "@/lib/freight/active-trip"
import { ActiveTripLink } from "@/components/shared/active-trip-link"
import { useOperationContext } from "@/hooks/use-operation-context"
import { usePermission } from "@/hooks/use-permission"
import { isAdminRole, PERMISSIONS } from "@/lib/rbac/permissions"

export function DriversListView() {
  const router = useRouter()
  const { user } = useAuth()
  const isAdmin = isAdminRole(user?.role)
  const canWrite = usePermission(PERMISSIONS.driversWrite)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { freights } = useOperationContext()
  const { data, isLoading } = useSWR("drivers", () => listDrivers(1, 50))

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteDriver(deleteId)
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
    <div>
      <PageHeader
        title="Motoristas"
        description="CNH, jornada e documentação"
        actions={
          <>
            {isAdmin && (
              <Button variant="outline" asChild>
                <Link href="/dashboard/motoristas/nova-conta">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Criar conta de acesso
                </Link>
              </Button>
            )}
            {canWrite && (
              <Button asChild>
                <Link href="/dashboard/motoristas/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo motorista
                </Link>
              </Button>
            )}
          </>
        }
      />
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : !data?.items.length ? (
        <EmptyState
          title="Sem motoristas"
          description="Cadastre motoristas da frota."
          actionLabel="Novo"
          onAction={() => router.push("/dashboard/motoristas/novo")}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.items.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <Link href={`/dashboard/motoristas/${d.id}`} className="font-semibold hover:underline">
                    {d.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    CNH {d.cnh_category} · {d.cnh_number}
                  </p>
                  <p className="text-xs text-muted-foreground">Validade: {formatDateBR(d.cnh_expires_at)}</p>
                  <ActiveTripLink freight={findActiveFreightByDriver(freights, d.id)} />
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{d.status}</Badge>
                  {canWrite && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" asChild aria-label="Editar">
                        <Link href={`/dashboard/motoristas/${d.id}/editar`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir"
                        onClick={() => setDeleteId(d.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
