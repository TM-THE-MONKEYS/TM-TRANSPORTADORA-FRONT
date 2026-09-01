"use client"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface EntityFilterSelectItem {
  id: string
  label: string
}

interface EntityFilterSelectProps {
  value: string | undefined
  onValueChange: (value: string | undefined) => void
  items: EntityFilterSelectItem[]
  allLabel: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

/**
 * Generic filter Select for entity-type filters (truck, driver, etc.).
 * Follows the dashboard pattern: internal "all" sentinel ↔ external undefined.
 */
export function EntityFilterSelect({
  value,
  onValueChange,
  items,
  allLabel,
  placeholder,
  className,
  disabled,
}: EntityFilterSelectProps) {
  return (
    <Select
      value={value ?? "all"}
      onValueChange={(v) => onValueChange(v === "all" ? undefined : v)}
      disabled={disabled}
    >
      <SelectTrigger className={cn("h-8 bg-background text-xs", className)}>
        <SelectValue placeholder={placeholder ?? allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {items.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
