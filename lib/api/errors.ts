import type { FastApiErrorBody } from "@/lib/api/types"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function formatFastApiDetail(body: FastApiErrorBody): string {
  if (!body) return "Erro desconhecido"
  if (typeof body.detail === "string") return body.detail
  if (Array.isArray(body.detail)) {
    return body.detail.map((d) => d.msg ?? String(d)).join("; ")
  }
  return JSON.stringify(body.detail ?? body)
}
