"use client"

import { useState } from "react"
import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchAddressByCep } from "@/lib/cep/viacep"
import { formatCep, isValidCepLength } from "@/lib/format/cep"

export type AddressFieldPrefix = "origin" | "destination"

type CepAddressFieldsProps<T extends FieldValues> = {
  title: string
  /** `origin` / `destination` ou caminho aninhado ex. `stops.0` */
  prefix: AddressFieldPrefix | string
  register: UseFormRegister<T>
  setValue: UseFormSetValue<T>
  errors: FieldErrors<T>
  /** Oculta bloco de legenda externa quando dentro de card numerado */
  nested?: boolean
}

function fieldName(prefix: string, suffix: string): string {
  if (prefix === "origin" || prefix === "destination") {
    return `${prefix}_${suffix}`
  }
  return `${prefix}.${suffix}`
}

export function CepAddressFields<T extends FieldValues>({
  title,
  prefix,
  register,
  setValue,
  errors,
  nested = false,
}: CepAddressFieldsProps<T>) {
  const cepKey = fieldName(prefix, "cep") as Path<T>
  const streetKey = fieldName(prefix, "street") as Path<T>
  const neighborhoodKey = fieldName(prefix, "neighborhood") as Path<T>
  const cityKey = fieldName(prefix, "city") as Path<T>
  const stateKey = fieldName(prefix, "state") as Path<T>

  const [loading, setLoading] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)

  async function lookupCep(raw: string) {
    if (!isValidCepLength(raw)) return

    setLoading(true)
    setCepError(null)
    try {
      const address = await fetchAddressByCep(raw)
      setValue(cepKey, address.cep as T[Path<T>], { shouldValidate: true })
      setValue(streetKey, address.street as T[Path<T>], { shouldValidate: true })
      setValue(neighborhoodKey, address.neighborhood as T[Path<T>], { shouldValidate: true })
      setValue(cityKey, address.city as T[Path<T>], { shouldValidate: true })
      setValue(stateKey, address.state as T[Path<T>], { shouldValidate: true })
    } catch (err) {
      setCepError(err instanceof Error ? err.message : "Erro ao buscar CEP")
    } finally {
      setLoading(false)
    }
  }

  function err(key: Path<T>): string | undefined {
    const parts = String(key).split(".")
    let node: unknown = errors
    for (const part of parts) {
      if (!node || typeof node !== "object") return undefined
      node = (node as Record<string, unknown>)[part]
    }
    const message = (node as { message?: unknown })?.message
    return typeof message === "string" ? message : undefined
  }

  const cepRegister = register(cepKey)

  return (
    <fieldset
      className={
        nested
          ? "space-y-3"
          : "space-y-3 rounded-lg border border-border/60 p-4"
      }
    >
      {!nested && <legend className="px-1 text-sm font-medium">{title}</legend>}
      {nested && <p className="text-sm font-medium">{title}</p>}

      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <div className="space-y-2">
          <Label htmlFor={String(cepKey)}>CEP</Label>
          <div className="relative">
            <Input
              id={String(cepKey)}
              inputMode="numeric"
              placeholder="00000-000"
              autoComplete="postal-code"
              {...cepRegister}
              onChange={(e) => {
                const formatted = formatCep(e.target.value)
                e.target.value = formatted
                cepRegister.onChange(e)
                setCepError(null)
                if (isValidCepLength(formatted)) void lookupCep(formatted)
              }}
              onBlur={(e) => {
                cepRegister.onBlur(e)
                if (isValidCepLength(e.target.value)) void lookupCep(e.target.value)
              }}
            />
            {loading && (
              <Loader2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          {(cepError || err(cepKey)) && (
            <p className="text-sm text-destructive">{cepError ?? err(cepKey)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={String(streetKey)}>Rua / logradouro</Label>
          <Input id={String(streetKey)} placeholder="Preenchido pelo CEP" {...register(streetKey)} />
          {err(streetKey) && <p className="text-sm text-destructive">{err(streetKey)}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={String(neighborhoodKey)}>Bairro</Label>
          <Input id={String(neighborhoodKey)} {...register(neighborhoodKey)} />
          {err(neighborhoodKey) && <p className="text-sm text-destructive">{err(neighborhoodKey)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor={String(cityKey)}>Cidade</Label>
          <Input id={String(cityKey)} {...register(cityKey)} />
          {err(cityKey) && <p className="text-sm text-destructive">{err(cityKey)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor={String(stateKey)}>UF</Label>
          <Input id={String(stateKey)} maxLength={2} className="uppercase" {...register(stateKey)} />
          {err(stateKey) && <p className="text-sm text-destructive">{err(stateKey)}</p>}
        </div>
      </div>
    </fieldset>
  )
}
