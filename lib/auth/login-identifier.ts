import { isValidCpfLength, stripCpf } from "@/lib/format/cpf"

export function isEmailLoginIdentifier(value: string): boolean {
  return value.trim().includes("@")
}

export function isValidLoginIdentifier(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (isEmailLoginIdentifier(trimmed)) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
  }
  return isValidCpfLength(trimmed)
}

export function normalizeStaffLoginEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function normalizeDriverLoginCpf(value: string): string {
  return stripCpf(value)
}
