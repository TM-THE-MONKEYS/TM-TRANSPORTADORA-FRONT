export type FastApiErrorBody = {
  detail?: string | { msg?: string; loc?: unknown[] }[]
}
