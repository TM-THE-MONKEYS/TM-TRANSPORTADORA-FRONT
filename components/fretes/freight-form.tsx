"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createFreight, findOrCreateClientByName } from "@/lib/api/services/freight"
import { CepAddressFields } from "@/components/shared/cep-address-fields"
import {
  formatMoneyInput,
  formatWeightInput,
  parseMoneyInput,
  parseWeightInput,
} from "@/lib/format/numbers"
import { useTenant } from "@/components/providers/tenant-provider"
import { useOperationContext } from "@/hooks/use-operation-context"

const schema = z.object({
  customer_name: z.string().min(2, "Informe o nome do cliente"),
  origin_cep: z.string().optional(),
  origin_street: z.string().optional(),
  origin_neighborhood: z.string().optional(),
  origin_city: z.string().min(2, "Informe a cidade de origem"),
  origin_state: z.string().length(2, "UF com 2 letras"),
  destination_cep: z.string().optional(),
  destination_street: z.string().optional(),
  destination_neighborhood: z.string().optional(),
  destination_city: z.string().min(2, "Informe a cidade de destino"),
  destination_state: z.string().length(2, "UF com 2 letras"),
  cargo_description: z.string().min(2, "Descreva a carga"),
  weight_kg: z.number().positive("Informe o peso em kg"),
  value_brl: z.number().positive("Informe o valor do frete"),
  freight_type: z.string().min(1),
  deadline_at: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const NONE = "__none__"

export function FreightForm() {
  const router = useRouter()
  const { branchId } = useTenant()
  const { drivers, trucks } = useOperationContext()
  const [weightDisplay, setWeightDisplay] = useState("")
  const [valueDisplay, setValueDisplay] = useState("")
  const [driverId, setDriverId] = useState<string>(NONE)
  const [truckId, setTruckId] = useState<string>(NONE)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      freight_type: "carga_geral",
      origin_state: "SP",
      destination_state: "SP",
      origin_cep: "",
      origin_street: "",
      origin_neighborhood: "",
      destination_cep: "",
      destination_street: "",
      destination_neighborhood: "",
      weight_kg: 0,
      value_brl: 0,
    },
  })

  async function onSubmit(data: FormData) {
    const weight_kg = parseWeightInput(weightDisplay)
    const value_brl = parseMoneyInput(valueDisplay)

    if (weight_kg <= 0) {
      toast.error("Informe o peso em kg")
      return
    }
    if (value_brl <= 0) {
      toast.error("Informe o valor do frete")
      return
    }

    try {
      const client = await findOrCreateClientByName(data.customer_name)
      const freight = await createFreight({
        customer_id: client.id,
        origin_cep: data.origin_cep,
        origin_street: data.origin_street,
        origin_neighborhood: data.origin_neighborhood,
        origin_city: data.origin_city,
        origin_state: data.origin_state.toUpperCase(),
        destination_cep: data.destination_cep,
        destination_street: data.destination_street,
        destination_neighborhood: data.destination_neighborhood,
        destination_city: data.destination_city,
        destination_state: data.destination_state.toUpperCase(),
        cargo_description: data.cargo_description,
        weight_kg,
        value_brl,
        freight_type: data.freight_type,
        deadline_at: data.deadline_at,
        branch_id: branchId ?? undefined,
        driver_id: driverId !== NONE ? driverId : undefined,
        truck_id: truckId !== NONE ? truckId : undefined,
        status: "orcamento",
      })
      toast.success("Ordem de frete criada")
      router.push(`/dashboard/fretes/${freight.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar frete")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customer_name">Cliente</Label>
        <Input
          id="customer_name"
          placeholder="Ex.: Transportes Silva Ltda"
          {...register("customer_name")}
        />
        <p className="text-xs text-muted-foreground">
          Apenas o nome. Não é necessário CPF ou CNPJ — o cadastro é automático se o cliente for novo.
        </p>
        {errors.customer_name && (
          <p className="text-sm text-destructive">{errors.customer_name.message}</p>
        )}
      </div>

      <CepAddressFields<FormData>
        title="Origem"
        prefix="origin"
        register={register}
        setValue={setValue}
        errors={errors}
      />

      <CepAddressFields<FormData>
        title="Destino"
        prefix="destination"
        register={register}
        setValue={setValue}
        errors={errors}
      />

      <div className="space-y-2">
        <Label htmlFor="cargo_description">Carga</Label>
        <Input id="cargo_description" placeholder="Descrição da mercadoria" {...register("cargo_description")} />
        {errors.cargo_description && (
          <p className="text-sm text-destructive">{errors.cargo_description.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Motorista (opcional)</Label>
          <Select value={driverId} onValueChange={setDriverId}>
            <SelectTrigger>
              <SelectValue placeholder="Sem motorista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sem motorista</SelectItem>
              {drivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Caminhão (opcional)</Label>
          <Select value={truckId} onValueChange={setTruckId}>
            <SelectTrigger>
              <SelectValue placeholder="Sem veículo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sem veículo</SelectItem>
              {trucks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.plate} — {t.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="weight_kg">Peso (kg)</Label>
          <Input
            id="weight_kg"
            inputMode="numeric"
            placeholder="Ex.: 28.000"
            value={weightDisplay}
            onChange={(e) => {
              const formatted = formatWeightInput(e.target.value)
              setWeightDisplay(formatted)
              setValue("weight_kg", parseWeightInput(formatted), { shouldValidate: true })
            }}
          />
          {errors.weight_kg && (
            <p className="text-sm text-destructive">{errors.weight_kg.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="value_brl">Valor (R$)</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R$
            </span>
            <Input
              id="value_brl"
              inputMode="numeric"
              className="pl-9"
              placeholder="0,00"
              value={valueDisplay}
              onChange={(e) => {
                const formatted = formatMoneyInput(e.target.value)
                setValueDisplay(formatted)
                setValue("value_brl", parseMoneyInput(formatted), { shouldValidate: true })
              }}
            />
          </div>
          {errors.value_brl && (
            <p className="text-sm text-destructive">{errors.value_brl.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline_at">Prazo</Label>
          <Input id="deadline_at" type="date" {...register("deadline_at")} />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Criar ordem"}
      </Button>
    </form>
  )
}
