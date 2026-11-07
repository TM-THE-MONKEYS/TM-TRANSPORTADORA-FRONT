"use client"

import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ListSearchFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  /** Debounce before notifying parent (API/SWR keys). Input stays instant. */
  debounceMs?: number
}

export function ListSearchField({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
  debounceMs = 300,
}: ListSearchFieldProps) {
  const [localValue, setLocalValue] = useState(value)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Sync when parent resets (ex.: limpar filtros).
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    if (localValue === value) return
    const timer = window.setTimeout(() => {
      onChangeRef.current(localValue)
    }, debounceMs)
    return () => window.clearTimeout(timer)
  }, [localValue, value, debounceMs])

  function clear() {
    setLocalValue("")
    if (value !== "") onChange("")
  }

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9 pr-9"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        aria-label={placeholder}
      />
      {localValue ? (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={clear}
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
