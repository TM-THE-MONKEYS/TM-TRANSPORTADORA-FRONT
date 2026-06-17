"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type EditField = {
  key: string
  label: string
  type: "text" | "number" | "select" | "date" | "textarea"
  options?: { value: string; label: string }[]
  required?: boolean
  placeholder?: string
}

type EntityEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  fields: EditField[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  onSave: () => void
  saving?: boolean
  saveLabel?: string
}

export function EntityEditDialog({
  open,
  onOpenChange,
  title,
  fields,
  values,
  onChange,
  onSave,
  saving,
  saveLabel = "Salvar",
}: EntityEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSave()
          }}
        >
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`edit-${field.key}`}>
                {field.label}
                {field.required && <span className="text-destructive"> *</span>}
              </Label>
              {field.type === "select" ? (
                <Select
                  value={values[field.key] ?? ""}
                  onValueChange={(v) => onChange(field.key, v)}
                >
                  <SelectTrigger id={`edit-${field.key}`}>
                    <SelectValue placeholder={field.placeholder ?? "Selecione"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "textarea" ? (
                <Textarea
                  id={`edit-${field.key}`}
                  value={values[field.key] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
              ) : (
                <Input
                  id={`edit-${field.key}`}
                  type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                  value={values[field.key] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : saveLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
