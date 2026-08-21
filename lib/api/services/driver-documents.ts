import { requirePublicApiUrl, shouldUseMocks } from "@/lib/api/config"
import { ApiError, formatFastApiDetail } from "@/lib/api/errors"
import type { FastApiErrorBody } from "@/lib/api/types"
import { normalizeDriverDocumentFile } from "@/lib/motoristas/document-types"
import type { DriverDocument, DriverDocumentType } from "@/types"
import * as mock from "@/lib/mocks/handlers"

export async function listDriverDocuments(driverId: string): Promise<DriverDocument[]> {
  if (shouldUseMocks()) return mock.mockListDriverDocuments(driverId)
  const { apiRequest } = await import("@/lib/api/client")
  return apiRequest(`/drivers/${driverId}/documents`, { auth: true })
}

export async function uploadDriverDocument(
  driverId: string,
  file: File,
  documentType: DriverDocumentType,
  label?: string,
): Promise<DriverDocument> {
  if (shouldUseMocks()) return mock.mockUploadDriverDocument(driverId, file, documentType, label)

  requirePublicApiUrl()

  const form = new FormData()
  const normalized = normalizeDriverDocumentFile(file)
  form.append("file", normalized)
  form.append("document_type", documentType)
  if (label?.trim()) form.append("label", label.trim())

  // BFF same-origin — cookie httpOnly injeta Authorization.
  const res = await fetch(`/api/v1/drivers/${driverId}/documents`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form,
    cache: "no-store",
    credentials: "include",
  })

  const text = await res.text()
  let json: unknown = {}
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = { detail: text }
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, formatFastApiDetail(json as FastApiErrorBody))
  }

  return json as DriverDocument
}

export async function deleteDriverDocument(driverId: string, documentId: string): Promise<void> {
  if (shouldUseMocks()) return mock.mockDeleteDriverDocument(driverId, documentId)
  const { apiRequest } = await import("@/lib/api/client")
  await apiRequest(`/drivers/${driverId}/documents/${documentId}`, {
    method: "DELETE",
    auth: true,
  })
}

/** Baixa arquivo autenticado e retorna blob URL para preview. */
export async function fetchDriverDocumentBlobUrl(
  driverId: string,
  downloadPath: string,
): Promise<string> {
  if (shouldUseMocks()) {
    return mock.mockDriverDocumentBlobUrl(driverId, downloadPath)
  }

  requirePublicApiUrl()
  const path = downloadPath.startsWith("/") ? downloadPath : `/${downloadPath}`
  const res = await fetch(`/api/v1${path}`, {
    cache: "no-store",
    credentials: "include",
  })

  if (!res.ok) {
    throw new ApiError(res.status, "Não foi possível carregar o documento.")
  }

  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
