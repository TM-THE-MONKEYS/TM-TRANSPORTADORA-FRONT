"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Pencil, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { SignaturePad } from "@/components/motoristas/signature-pad"
import { getDriver } from "@/lib/api/services/drivers"
import { deleteDriverWithAccount } from "@/lib/motoristas/delete-driver-account"
import { formatDateBR } from "@/lib/format/dates"
import { findActiveFreightByDriver } from "@/lib/freight/active-trip"
import { ActiveTripLink } from "@/components/shared/active-trip-link"
import { useOperationContext } from "@/hooks/use-operation-context"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"

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

  if (!driver) return <Skeleton className="h-96 w-full" />

  return (
    <div>
      <PageHeader
        title={driver.name}
        description={`CNH ${driver.cnh_category}`}
        actions={
          canWrite && (
            <div className="flex gap-2">
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
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
        </TabsList>
        <TabsContent value="dados" className="mt-4">
          <Card>
            <CardContent className="grid gap-2 pt-6 sm:grid-cols-2">
              <p>CPF: {driver.cpf ?? "—"}</p>
              <p>Status: {driver.status}</p>
              <p>CNH: {driver.cnh_number}</p>
              <p>Validade: {formatDateBR(driver.cnh_expires_at)}</p>
              <p>Comissão: {driver.commission_pct ?? 0}%</p>
              <p>Telefone: {driver.phone ?? "—"}</p>
              <p>E-mail de login: {driver.email ?? "—"}</p>
              <p>Conta de acesso: {driver.user_id ? "Ativa" : "Não criada"}</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documentos" className="mt-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Upload foto/documentos — POST /uploads/presign</p>
              <Button variant="outline" disabled>
                Enviar foto
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="assinatura" className="mt-4">
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
