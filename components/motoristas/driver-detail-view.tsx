"use client"

import useSWR from "swr"
import { toast } from "sonner"
import { Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { SignaturePad } from "@/components/motoristas/signature-pad"
import { getDriver } from "@/lib/api/services/drivers"
import { formatDateBR } from "@/lib/format/dates"

export function DriverDetailView({ id }: { id: string }) {
  const { data: driver } = useSWR(["driver", id], () => getDriver(id))

  if (!driver) return <Skeleton className="h-96 w-full" />

  return (
    <div>
      <PageHeader title={driver.name} description={`CNH ${driver.cnh_category}`} />
      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
        </TabsList>
        <TabsContent value="dados" className="mt-4">
          <Card>
            <CardContent className="grid gap-2 pt-6 sm:grid-cols-2">
              <p>Status: {driver.status}</p>
              <p>CNH: {driver.cnh_number}</p>
              <p>Validade: {formatDateBR(driver.cnh_expires_at)}</p>
              <p>Comissão: {driver.commission_pct ?? 0}%</p>
              <p>Telefone: {driver.phone ?? "—"}</p>
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
    </div>
  )
}
