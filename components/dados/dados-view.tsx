"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/page-header"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useAuth } from "@/components/providers/auth-provider"
import { DataTable } from "@/components/dados/data-table"
import { EntityEditDialog, type EditField } from "@/components/dados/entity-edit-dialog"
import { deleteClient, listClients, updateClient } from "@/lib/api/services/clients"
import { listDrivers, updateDriver, deleteDriver } from "@/lib/api/services/drivers"
import {
  createFinanceEntry,
  deleteFinanceEntry,
  invalidateFinanceCaches,
  listFinanceEntries,
  updateFinanceEntry,
} from "@/lib/api/services/finance"
import { listTrucks, updateTruck, deleteTruck } from "@/lib/api/services/fleet"
import { listFreights, updateFreight, deleteFreight } from "@/lib/api/services/freight"
import { listAllFuelRefills, type FuelRefill } from "@/lib/api/services/fuel"
import { formatBRL } from "@/lib/format/currency"
import { formatKm } from "@/lib/format/numbers"
import { FREIGHT_STATUS_LABELS } from "@/lib/freight/status"
import { getDefaultHomeRoute, isAdminRole } from "@/lib/rbac/permissions"
import type {
  Customer,
  Driver,
  FinanceEntry,
  FreightOrder,
  Paginated,
  Truck,
} from "@/types"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

type EntityTabId =
  | "fretes"
  | "motoristas"
  | "frota"
  | "financeiro"
  | "clientes"
  | "abastecimento"

const TAB_LABELS: Record<EntityTabId, string> = {
  fretes: "Fretes",
  motoristas: "Motoristas",
  frota: "Frota",
  financeiro: "Financeiro",
  clientes: "Clientes",
  abastecimento: "Abastecimento",
}

const FREIGHT_STATUS_OPTIONS = Object.entries(FREIGHT_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const DRIVER_STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
  { value: "suspenso", label: "Suspenso" },
  { value: "ferias", label: "Férias" },
]

const TRUCK_STATUS_OPTIONS = [
  { value: "disponivel", label: "Disponível" },
  { value: "em_viagem", label: "Em viagem" },
  { value: "em_manutencao", label: "Em manutenção" },
  { value: "inativo", label: "Inativo" },
]

const FINANCE_TYPE_OPTIONS = [
  { value: "receita", label: "Receita" },
  { value: "despesa", label: "Despesa" },
]

const FINANCE_STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
  { value: "cancelado", label: "Cancelado" },
  { value: "vencido", label: "Vencido" },
]

const EDIT_FIELDS: Partial<Record<EntityTabId, EditField[]>> = {
  clientes: [
    { key: "nome", label: "Nome", type: "text", required: true },
    { key: "cpf_cnpj", label: "CPF / CNPJ", type: "text", placeholder: "000.000.000-00" },
    { key: "email", label: "E-mail", type: "text", placeholder: "contato@empresa.com" },
    { key: "telefone", label: "Telefone", type: "text", placeholder: "(11) 90000-0000" },
  ],
  fretes: [
    { key: "status", label: "Status", type: "select", options: FREIGHT_STATUS_OPTIONS, required: true },
    { key: "value_brl", label: "Valor (R$)", type: "number", required: true },
    { key: "origin_city", label: "Cidade origem", type: "text", required: true },
    { key: "destination_city", label: "Cidade destino", type: "text", required: true },
    { key: "cargo_description", label: "Carga", type: "textarea" },
  ],
  motoristas: [
    { key: "name", label: "Nome", type: "text", required: true },
    { key: "cpf", label: "CPF", type: "text", required: true },
    { key: "cnh_number", label: "CNH", type: "text", required: true },
    { key: "cnh_category", label: "Categoria CNH", type: "text", required: true },
    { key: "status", label: "Status", type: "select", options: DRIVER_STATUS_OPTIONS, required: true },
    { key: "phone", label: "Telefone", type: "text" },
    { key: "email", label: "E-mail", type: "text" },
  ],
  frota: [
    { key: "plate", label: "Placa", type: "text", required: true },
    { key: "brand", label: "Marca", type: "text", required: true },
    { key: "model", label: "Modelo", type: "text", required: true },
    { key: "year", label: "Ano", type: "number", required: true },
    { key: "type", label: "Tipo", type: "text", required: true },
    { key: "status", label: "Status", type: "select", options: TRUCK_STATUS_OPTIONS, required: true },
    { key: "mileage_km", label: "Quilometragem", type: "number", required: true },
  ],
  financeiro: [
    { key: "tipo", label: "Tipo", type: "select", options: FINANCE_TYPE_OPTIONS, required: true },
    { key: "categoria", label: "Categoria", type: "text", required: true },
    { key: "descricao", label: "Descrição", type: "textarea" },
    { key: "valor", label: "Valor (R$)", type: "number", required: true },
    { key: "status", label: "Status", type: "select", options: FINANCE_STATUS_OPTIONS, required: true },
    { key: "data_vencimento", label: "Vencimento", type: "date" },
  ],
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("pt-BR")
}

function toEditValues(entity: EntityTabId, row: Record<string, unknown>): Record<string, string> {
  const fields = EDIT_FIELDS[entity] ?? []
  const values: Record<string, string> = {}
  for (const field of fields) {
    // clientes usa "nome" no backend mas "name" no frontend
    const raw = field.key === "nome" ? (row["name"] ?? row["nome"]) : row[field.key]
    if (raw == null) {
      values[field.key] = ""
    } else if (field.key === "data_vencimento" && typeof raw === "string") {
      values[field.key] = raw.slice(0, 10)
    } else {
      values[field.key] = String(raw)
    }
  }
  return values
}

function parseEditPayload(entity: EntityTabId, values: Record<string, string>): Record<string, unknown> {
  if (entity === "clientes") {
    return {
      nome: values.nome.trim(),
      cpf_cnpj: values.cpf_cnpj.trim() || undefined,
      email: values.email.trim() || undefined,
      telefone: values.telefone.trim() || undefined,
    }
  }
  if (entity === "fretes") {
    return {
      status: values.status,
      value_brl: Number(values.value_brl),
      origin_city: values.origin_city.trim(),
      destination_city: values.destination_city.trim(),
      cargo_description: values.cargo_description.trim() || undefined,
    }
  }
  if (entity === "motoristas") {
    return {
      name: values.name.trim(),
      cpf: values.cpf.trim(),
      cnh_number: values.cnh_number.trim(),
      cnh_category: values.cnh_category.trim(),
      status: values.status,
      phone: values.phone.trim() || undefined,
      email: values.email.trim() || null,
    }
  }
  if (entity === "frota") {
    return {
      plate: values.plate.trim(),
      brand: values.brand.trim(),
      model: values.model.trim(),
      year: Number(values.year),
      type: values.type.trim(),
      status: values.status,
      mileage_km: Number(values.mileage_km),
    }
  }
  if (entity === "financeiro") {
    return {
      tipo: values.tipo,
      categoria: values.categoria.trim(),
      descricao: values.descricao.trim() || undefined,
      valor: Number(values.valor),
      status: values.status,
      data_vencimento: values.data_vencimento || undefined,
    }
  }
  return values
}

function emptyEditValues(entity: EntityTabId): Record<string, string> {
  const fields = EDIT_FIELDS[entity] ?? []
  return Object.fromEntries(fields.map((f) => [f.key, ""]))
}

type PaginatedPanelProps<T> = {
  entity: EntityTabId
  page: number
  onPageChange: (page: number) => void
  pageSize: number
  onPageSizeChange: (size: number) => void
  data?: Paginated<T>
  error?: Error
  isLoading: boolean
  columns: ColumnDef<T, unknown>[]
  filterPlaceholder: string
  emptyMessage: string
  canCreate?: boolean
  onCreate?: () => void
}

function PaginatedEntityPanel<T>({
  entity,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
  data,
  error,
  isLoading,
  columns,
  filterPlaceholder,
  emptyMessage,
  canCreate,
  onCreate,
}: PaginatedPanelProps<T>) {
  const totalPages = data?.pages ?? 1
  const hasPrev = page > 1
  const hasNext = data?.has_next ?? page < totalPages

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">{TAB_LABELS[entity]}</CardTitle>
        {canCreate && onCreate && (
          <Button type="button" size="sm" onClick={onCreate}>
            <Plus className="mr-1 h-4 w-4" />
            Novo
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={isLoading}
          error={error ?? null}
          filterPlaceholder={filterPlaceholder}
          emptyMessage={emptyMessage}
        />
        {!isLoading && (data?.total ?? 0) > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="shrink-0">Linhas por página</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  onPageSizeChange(Number(v))
                  onPageChange(1)
                }}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <span className="shrink-0">
                Página {page} de {totalPages} · {data?.total ?? 0} registros
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!hasPrev}
                  onClick={() => onPageChange(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!hasNext}
                  onClick={() => onPageChange(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type FlatPanelProps<T> = {
  title: string
  data: T[]
  error?: Error
  isLoading: boolean
  columns: ColumnDef<T, unknown>[]
  filterPlaceholder: string
  emptyMessage: string
  readOnlyNote?: string
  pageSizeOptions?: number[]
}

function FlatEntityPanel<T>({
  title,
  data,
  error,
  isLoading,
  columns,
  filterPlaceholder,
  emptyMessage,
  readOnlyNote,
  pageSizeOptions,
}: FlatPanelProps<T>) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        {readOnlyNote && (
          <p className="text-sm text-muted-foreground">{readOnlyNote}</p>
        )}
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data}
          loading={isLoading}
          error={error ?? null}
          filterPlaceholder={filterPlaceholder}
          emptyMessage={emptyMessage}
          pageSizeOptions={pageSizeOptions}
        />
      </CardContent>
    </Card>
  )
}

export function DadosView() {
  const router = useRouter()
  const { user, isReady } = useAuth()
  const isAdmin = isAdminRole(user?.role)

  const [activeTab, setActiveTab] = useState<EntityTabId>("fretes")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1])

  const [editOpen, setEditOpen] = useState(false)
  const [editMode, setEditMode] = useState<"edit" | "create">("edit")
  const [editEntity, setEditEntity] = useState<EntityTabId | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteEntity, setDeleteEntity] = useState<EntityTabId | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!isReady) return
    if (!user || !isAdmin) {
      router.replace(getDefaultHomeRoute(user?.role ?? "cliente", user?.permissions))
    }
  }, [isReady, user, isAdmin, router])

  useEffect(() => {
    setPage(1)
  }, [activeTab, pageSize])

  const swrKey = (suffix: string) =>
    isAdmin && activeTab === suffix.split(":")[0]
      ? ["dados", suffix, pageSize]
      : null

  const {
    data: freightsPage,
    error: freightsError,
    isLoading: loadingFreights,
    mutate: refreshFreights,
  } = useSWR(swrKey(`fretes:${page}`), () => listFreights(page, pageSize))

  const {
    data: driversPage,
    error: driversError,
    isLoading: loadingDrivers,
    mutate: refreshDrivers,
  } = useSWR(swrKey(`motoristas:${page}`), () => listDrivers(page, pageSize))

  const {
    data: trucksPage,
    error: trucksError,
    isLoading: loadingTrucks,
    mutate: refreshTrucks,
  } = useSWR(swrKey(`frota:${page}`), () => listTrucks(page, pageSize))

  const {
    data: financePage,
    error: financeError,
    isLoading: loadingFinance,
    mutate: refreshFinance,
  } = useSWR(swrKey(`financeiro:${page}`), () => listFinanceEntries(page, pageSize))

  const {
    data: clients,
    error: clientsError,
    isLoading: loadingClients,
    mutate: refreshClients,
  } = useSWR(swrKey("clientes:1"), () => listClients(1, 100))

  const {
    data: refills,
    error: refillsError,
    isLoading: loadingRefills,
  } = useSWR(swrKey("abastecimento:1"), () => listAllFuelRefills(1, 100))

  const refreshEntity = useCallback(
    async (entity: EntityTabId) => {
      if (entity === "fretes") await refreshFreights()
      else if (entity === "motoristas") await refreshDrivers()
      else if (entity === "frota") await refreshTrucks()
      else if (entity === "clientes") await refreshClients()
      else if (entity === "financeiro") {
        await refreshFinance()
        invalidateFinanceCaches()
      }
    },
    [refreshFreights, refreshDrivers, refreshTrucks, refreshFinance, refreshClients],
  )

  const openEdit = useCallback((entity: EntityTabId, row: Record<string, unknown>) => {
    setEditMode("edit")
    setEditEntity(entity)
    setEditId(String(row.id))
    setEditValues(toEditValues(entity, row))
    setEditOpen(true)
  }, [])

  const openCreate = useCallback((entity: EntityTabId) => {
    setEditMode("create")
    setEditEntity(entity)
    setEditId(null)
    setEditValues(emptyEditValues(entity))
    setEditOpen(true)
  }, [])

  const openDelete = useCallback((entity: EntityTabId, id: string) => {
    setDeleteEntity(entity)
    setDeleteId(id)
    setDeleteOpen(true)
  }, [])

  const actionColumn = useCallback(
    <T extends { id: string }>(
      entity: EntityTabId,
      canEdit: boolean,
      canDelete: boolean,
    ): ColumnDef<T, unknown> => ({
      id: "actions",
      header: "Ações",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-1">
          {canEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Editar"
              onClick={() => openEdit(entity, row.original as Record<string, unknown>)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              aria-label="Excluir"
              onClick={() => openDelete(entity, row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    }),
    [openEdit, openDelete],
  )

  const freightColumns = useMemo<ColumnDef<FreightOrder, unknown>[]>(
    () => [
      { accessorKey: "code", header: "Código" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => FREIGHT_STATUS_LABELS[getValue() as FreightOrder["status"]] ?? String(getValue()),
      },
      { accessorKey: "customer_name", header: "Cliente", cell: ({ getValue }) => getValue() ?? "—" },
      {
        id: "route",
        header: "Rota",
        accessorFn: (row) => `${row.origin_city} → ${row.destination_city}`,
      },
      {
        accessorKey: "value_brl",
        header: "Valor",
        cell: ({ getValue }) => formatBRL(Number(getValue())),
      },
      {
        accessorKey: "created_at",
        header: "Criado",
        cell: ({ getValue }) => formatDate(String(getValue())),
      },
      actionColumn("fretes", true, true),
    ],
    [actionColumn],
  )

  const driverColumns = useMemo<ColumnDef<Driver, unknown>[]>(
    () => [
      { accessorKey: "name", header: "Nome" },
      { accessorKey: "cpf", header: "CPF" },
      { accessorKey: "cnh_number", header: "CNH" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "phone", header: "Telefone", cell: ({ getValue }) => getValue() ?? "—" },
      actionColumn("motoristas", true, true),
    ],
    [actionColumn],
  )

  const truckColumns = useMemo<ColumnDef<Truck, unknown>[]>(
    () => [
      { accessorKey: "plate", header: "Placa" },
      { accessorKey: "brand", header: "Marca" },
      { accessorKey: "model", header: "Modelo" },
      { accessorKey: "year", header: "Ano" },
      { accessorKey: "status", header: "Status" },
      {
        accessorKey: "mileage_km",
        header: "Km",
        cell: ({ getValue }) => formatKm(Number(getValue())),
      },
      actionColumn("frota", true, true),
    ],
    [actionColumn],
  )

  const financeColumns = useMemo<ColumnDef<FinanceEntry, unknown>[]>(
    () => [
      { accessorKey: "tipo", header: "Tipo" },
      { accessorKey: "categoria", header: "Categoria" },
      {
        accessorKey: "descricao",
        header: "Descrição",
        cell: ({ getValue }) => getValue() ?? "—",
      },
      {
        accessorKey: "valor",
        header: "Valor",
        cell: ({ getValue }) => formatBRL(Number(getValue())),
      },
      { accessorKey: "status", header: "Status" },
      {
        accessorKey: "data_vencimento",
        header: "Vencimento",
        cell: ({ getValue }) => formatDate(getValue() as string | undefined),
      },
      actionColumn("financeiro", true, true),
    ],
    [actionColumn],
  )

  const clientColumns = useMemo<ColumnDef<Customer, unknown>[]>(
    () => [
      {
        id: "name",
        header: "Nome",
        accessorFn: (row) => row.name ?? row.nome ?? "—",
      },
      {
        id: "document",
        header: "Documento",
        accessorFn: (row) => row.document ?? row.cpf_cnpj ?? "—",
      },
      { accessorKey: "email", header: "E-mail", cell: ({ getValue }) => getValue() ?? "—" },
      {
        id: "phone",
        header: "Telefone",
        accessorFn: (row) => row.phone ?? row.telefone ?? "—",
      },
      actionColumn("clientes", true, true),
    ],
    [actionColumn],
  )

  const refillColumns = useMemo<ColumnDef<FuelRefill, unknown>[]>(
    () => [
      {
        accessorKey: "freight_code",
        header: "Frete",
        cell: ({ row }) => row.original.freight_code ?? row.original.freight_id.slice(0, 8),
      },
      {
        id: "location",
        header: "Local",
        accessorFn: (row) => row.posto ?? row.cidade ?? "—",
      },
      {
        accessorKey: "litros",
        header: "Litros",
        cell: ({ getValue }) => `${Number(getValue()).toLocaleString("pt-BR")} L`,
      },
      {
        accessorKey: "valor_total",
        header: "Valor",
        cell: ({ getValue }) => formatBRL(Number(getValue())),
      },
      {
        accessorKey: "km_atual",
        header: "Km",
        cell: ({ getValue }) => (getValue() != null ? formatKm(Number(getValue())) : "—"),
      },
      {
        accessorKey: "created_at",
        header: "Data",
        cell: ({ getValue }) => formatDate(String(getValue())),
      },
    ],
    [],
  )

  async function handleSaveEdit() {
    if (!editEntity) return
    const fields = EDIT_FIELDS[editEntity]
    if (!fields) return

    for (const field of fields) {
      if (field.required && !editValues[field.key]?.trim()) {
        toast.error(`Preencha o campo "${field.label}"`)
        return
      }
    }

    setSaving(true)
    try {
      const payload = parseEditPayload(editEntity, editValues)

      if (editMode === "create" && editEntity === "financeiro") {
        await createFinanceEntry(payload as Omit<FinanceEntry, "id" | "created_at" | "updated_at">)
        toast.success("Lançamento criado")
      } else if (editId) {
        if (editEntity === "fretes") await updateFreight(editId, payload)
        else if (editEntity === "motoristas") await updateDriver(editId, payload)
        else if (editEntity === "frota") await updateTruck(editId, payload)
        else if (editEntity === "financeiro") await updateFinanceEntry(editId, payload)
        else if (editEntity === "clientes") await updateClient(editId, payload as Parameters<typeof updateClient>[1])
        toast.success("Registro atualizado")
      }

      setEditOpen(false)
      await refreshEntity(editEntity)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteEntity || !deleteId) return

    setDeleting(true)
    try {
      if (deleteEntity === "fretes") await deleteFreight(deleteId)
      else if (deleteEntity === "motoristas") await deleteDriver(deleteId)
      else if (deleteEntity === "frota") await deleteTruck(deleteId)
      else if (deleteEntity === "financeiro") await deleteFinanceEntry(deleteId)
      else if (deleteEntity === "clientes") await deleteClient(deleteId)

      toast.success("Registro excluído")
      setDeleteOpen(false)
      await refreshEntity(deleteEntity)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir")
    } finally {
      setDeleting(false)
    }
  }

  if (!isReady || !user || !isAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Verificando permissões...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dados"
        description="Visualize e edite registros do banco via API. Acesso restrito a administradores."
        actions={<Badge variant="secondary">Admin</Badge>}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EntityTabId)}>
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          {(Object.keys(TAB_LABELS) as EntityTabId[]).map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="fretes">
          <PaginatedEntityPanel
            entity="fretes"
            page={page}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            data={freightsPage}
            error={freightsError}
            isLoading={loadingFreights}
            columns={freightColumns}
            filterPlaceholder="Filtrar fretes..."
            emptyMessage="Nenhum frete encontrado"
          />
        </TabsContent>

        <TabsContent value="motoristas">
          <PaginatedEntityPanel
            entity="motoristas"
            page={page}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            data={driversPage}
            error={driversError}
            isLoading={loadingDrivers}
            columns={driverColumns}
            filterPlaceholder="Filtrar motoristas..."
            emptyMessage="Nenhum motorista encontrado"
          />
        </TabsContent>

        <TabsContent value="frota">
          <PaginatedEntityPanel
            entity="frota"
            page={page}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            data={trucksPage}
            error={trucksError}
            isLoading={loadingTrucks}
            columns={truckColumns}
            filterPlaceholder="Filtrar veículos..."
            emptyMessage="Nenhum veículo encontrado"
          />
        </TabsContent>

        <TabsContent value="financeiro">
          <PaginatedEntityPanel
            entity="financeiro"
            page={page}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            data={financePage}
            error={financeError}
            isLoading={loadingFinance}
            columns={financeColumns}
            filterPlaceholder="Filtrar lançamentos..."
            emptyMessage="Nenhum lançamento encontrado"
            canCreate
            onCreate={() => openCreate("financeiro")}
          />
        </TabsContent>

        <TabsContent value="clientes">
          <FlatEntityPanel
            title="Clientes"
            data={clients ?? []}
            error={clientsError}
            isLoading={loadingClients}
            columns={clientColumns}
            filterPlaceholder="Filtrar clientes..."
            emptyMessage="Nenhum cliente encontrado"
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </TabsContent>

        <TabsContent value="abastecimento">
          <FlatEntityPanel
            title="Abastecimentos"
            data={refills ?? []}
            error={refillsError}
            isLoading={loadingRefills}
            columns={refillColumns}
            filterPlaceholder="Filtrar abastecimentos..."
            emptyMessage="Nenhum abastecimento registrado"
            readOnlyNote="Somente leitura. Registros via página de Abastecimento."
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </TabsContent>

      </Tabs>

      {editEntity && EDIT_FIELDS[editEntity] && (
        <EntityEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          title={
            editMode === "create"
              ? `Novo ${TAB_LABELS[editEntity].toLowerCase().replace(/s$/, "")}`
              : `Editar ${TAB_LABELS[editEntity].slice(0, -1).toLowerCase()}`
          }
          fields={EDIT_FIELDS[editEntity]!}
          values={editValues}
          onChange={(key, value) => setEditValues((prev) => ({ ...prev, [key]: value }))}
          onSave={handleSaveEdit}
          saving={saving}
          saveLabel={editMode === "create" ? "Criar" : "Salvar"}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir registro"
        description="Esta ação não pode ser desfeita. O registro será removido permanentemente do banco."
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
