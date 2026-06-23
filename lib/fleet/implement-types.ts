import type { ImplementType } from "@/types"

export const IMPLEMENT_TYPE_LABELS: Record<ImplementType, string> = {
  carreta: "Carreta",
  bau: "Baú",
  tanque: "Tanque",
  prancha: "Prancha",
  camera_fria: "Câmara fria",
}

export const IMPLEMENT_TYPES = Object.keys(IMPLEMENT_TYPE_LABELS) as ImplementType[]
