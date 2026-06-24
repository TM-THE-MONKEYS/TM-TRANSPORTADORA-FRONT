"use client"

import { useEffect, useRef, useState } from "react"
import useSWR, { mutate } from "swr"
import { ExternalLink, FileText, ImageIcon, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  deleteDriverDocument,
  fetchDriverDocumentBlobUrl,
  listDriverDocuments,
  uploadDriverDocument,
} from "@/lib/api/services/driver-documents"
import {
  ACCEPT_DRIVER_DOCUMENTS,
  DRIVER_DOCUMENT_TYPE_LABELS,
  DRIVER_DOCUMENT_TYPES,
  MAX_DRIVER_DOCUMENT_MB,
} from "@/lib/motoristas/document-types"
import type { DriverDocument, DriverDocumentType } from "@/types"

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocumentPreview({ driverId, doc }: { driverId: string; doc: DriverDocument }) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    setLoading(true)
    fetchDriverDocumentBlobUrl(driverId, doc.download_path)
      .then((u) => {
        if (!active) return
        objectUrl = u
        setUrl(u)
      })
      .catch(() => {
        if (active) setUrl(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
      if (objectUrl?.startsWith("blob:")) URL.revokeObjectURL(objectUrl)
    }
  }, [driverId, doc.download_path])

  if (loading) return <Skeleton className="h-24 w-full rounded-md" />
  if (!url) {
    return (
      <div className="flex h-24 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
        Preview indisponível
      </div>
    )
  }

  if (doc.content_type.startsWith("image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={doc.filename} className="h-24 w-full rounded-md object-cover" />
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-24 flex-col items-center justify-center gap-1 rounded-md bg-muted text-sm text-muted-foreground hover:text-foreground"
    >
      <FileText className="h-8 w-8" />
      Abrir PDF
    </a>
  )
}

export function DriverDocumentsPanel({
  driverId,
  canWrite,
}: {
  driverId: string
  canWrite: boolean
}) {
  const swrKey = ["driver-documents", driverId]
  const { data: documents, isLoading } = useSWR(swrKey, () => listDriverDocuments(driverId))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [documentType, setDocumentType] = useState<DriverDocumentType>("cnh_front")
  const [label, setLabel] = useState("")
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_DRIVER_DOCUMENT_MB * 1024 * 1024) {
      toast.error(`Arquivo maior que ${MAX_DRIVER_DOCUMENT_MB} MB`)
      e.target.value = ""
      return
    }

    setUploading(true)
    try {
      await uploadDriverDocument(driverId, file, documentType, label || undefined)
      toast.success("Documento anexado")
      setLabel("")
      await mutate(swrKey)
      await mutate(["driver", driverId])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar documento")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteDriverDocument(driverId, deleteId)
      toast.success("Documento removido")
      await mutate(swrKey)
      await mutate(["driver", driverId])
      setDeleteId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Documentos e foto
          </CardTitle>
          <CardDescription>
            CNH, foto e outros anexos (JPG, PNG, WEBP ou PDF — máx. {MAX_DRIVER_DOCUMENT_MB} MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {canWrite && (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de documento</Label>
                  <Select
                    value={documentType}
                    onValueChange={(v) => setDocumentType(v as DriverDocumentType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DRIVER_DOCUMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {DRIVER_DOCUMENT_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-label">Descrição (opcional)</Label>
                  <Input
                    id="doc-label"
                    placeholder="Ex: CNH digital 2026"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_DRIVER_DOCUMENTS}
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                className="mt-4"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploading ? "Enviando..." : "Selecionar e anexar arquivo"}
              </Button>
            </div>
          )}

          {isLoading ? (
            <Skeleton className="h-32 w-full rounded-lg" />
          ) : !documents?.length ? (
            <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
              Nenhum documento anexado ainda.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm"
                >
                  <DocumentPreview driverId={driverId} doc={doc} />
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{DRIVER_DOCUMENT_TYPE_LABELS[doc.type]}</p>
                        <p className="truncate text-sm text-muted-foreground">{doc.filename}</p>
                        {doc.label && (
                          <p className="text-xs text-muted-foreground">{doc.label}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </p>
                      </div>
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Excluir documento"
                          onClick={() => setDeleteId(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a
                        href="#"
                        onClick={async (e) => {
                          e.preventDefault()
                          try {
                            const url = await fetchDriverDocumentBlobUrl(driverId, doc.download_path)
                            window.open(url, "_blank", "noopener,noreferrer")
                          } catch {
                            toast.error("Não foi possível abrir o arquivo")
                          }
                        }}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remover documento?"
        description="O arquivo será excluído permanentemente."
        confirmLabel="Remover"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
