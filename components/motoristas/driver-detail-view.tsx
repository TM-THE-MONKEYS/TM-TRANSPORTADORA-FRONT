"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import {
  BadgePercent,
  Calendar,
  CreditCard,
  IdCard,
  Mail,
  Pencil,
  Phone,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/shared/page-header"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DriverDocumentsPanel } from "@/components/motoristas/driver-documents-panel"
import { SignaturePad } from "@/components/motoristas/signature-pad"
import { getDriver } from "@/lib/api/services/drivers"
import { deleteDriverWithAccount } from "@/lib/motoristas/delete-driver-account"
import {
  DRIVER_STATUS_LABELS,
  DRIVER_STATUS_VARIANT,
  driverInitials,
  formatCommissionPct,
} from "@/lib/motoristas/driver-status"
import { formatCpf } from "@/lib/format/cpf"
import { formatDateBR } from "@/lib/format/dates"
import { findActiveFreightByDriver } from "@/lib/freight/active-trip"
import { ActiveTripLink } from "@/components/shared/active-trip-link"
import { useOperationContext } from "@/hooks/use-operation-context"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import type { DriverStatus } from "@/types"

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function DriverDetailView({ id }: { id: string }) {
  const router = useRouter()
  const canWrite = usePermission(PERMISSIONS.driversWrite)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { freights } = useOperationContext()
  const { data: driver } = useSWR(["driver", id], () => getDriver(id))
  const activeTrip = driver ? findActiveFreightByDriver(freights, driver.id) : undefined

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteDriverWithAccount(id)
      toast.success("Motorista excluído")
      router.push("/dashboard/motoristas")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir")
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (!driver) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    )
  }

  const status = driver.status as DriverStatus

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
            {driverInitials(driver.name)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{driver.name}</h2>
              <Badge variant={DRIVER_STATUS_VARIANT[status]}>{DRIVER_STATUS_LABELS[status]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              CNH {driver.cnh_category} · {driver.cnh_number}
            </p>
          </div>
        </div>

        {canWrite && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/motoristas/${id}/editar`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        )}
      </div>

      {activeTrip && <ActiveTripLink freight={activeTrip} />}

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem icon={UserRound} label="CPF" value={driver.cpf ? formatCpf(driver.cpf) : "—"} />
            <InfoItem icon={Phone} label="Telefone" value={driver.phone ?? "—"} />
            <InfoItem icon={Mail} label="E-mail de login" value={driver.email ?? "—"} />
            <InfoItem icon={IdCard} label="Número CNH" value={driver.cnh_number} />
            <InfoItem icon={Calendar} label="Validade CNH" value={formatDateBR(driver.cnh_expires_at)} />
            <InfoItem
              icon={BadgePercent}
              label="Comissão"
              value={formatCommissionPct(driver.commission_pct)}
            />
            <InfoItem
              icon={Shield}
              label="Conta de acesso"
              value={driver.user_id ? "Ativa" : "Não criada"}
            />
            <InfoItem icon={CreditCard} label="Categoria CNH" value={driver.cnh_category} />
          </div>
        </TabsContent>

        <TabsContent value="documentos">
          <DriverDocumentsPanel driverId={id} canWrite={canWrite} />
        </TabsContent>

        <TabsContent value="assinatura">
          <Card>
            <CardHeader>
              <CardTitle>Assinatura digital</CardTitle>
            </CardHeader>
            <CardContent>
              <SignaturePad onSave={() => toast.success("Assinatura salva (mock)")} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir motorista?"
        description="O registro será removido permanentemente."
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
