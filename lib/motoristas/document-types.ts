import type { DriverDocumentType } from "@/types"

export const DRIVER_DOCUMENT_TYPE_LABELS: Record<DriverDocumentType, string> = {
  photo: "Foto do motorista",
  cnh_front: "CNH — frente",
  cnh_back: "CNH — verso",
  other: "Outro documento",
}

export const DRIVER_DOCUMENT_TYPES = Object.keys(
  DRIVER_DOCUMENT_TYPE_LABELS,
) as DriverDocumentType[]

export const ACCEPT_DRIVER_DOCUMENTS =
  "image/jpeg,image/png,image/webp,application/pdf"

export const MAX_DRIVER_DOCUMENT_MB = 5

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
}

/** Windows/browser often send empty type or octet-stream for CNH scans. */
export function normalizeDriverDocumentFile(file: File): File {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  const inferred = MIME_BY_EXTENSION[ext]
  const current = file.type.split(";")[0]?.trim().toLowerCase()
  const needsFix =
    !current || current === "application/octet-stream" || !ACCEPT_DRIVER_DOCUMENTS.includes(current)

  if (!inferred || !needsFix) return file
  return new File([file], file.name, { type: inferred, lastModified: file.lastModified })
}
