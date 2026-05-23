"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"

type AutofillGuardInputProps = React.ComponentProps<typeof Input>

/**
 * Evita preenchimento automático do navegador no carregamento da página.
 * O campo fica readonly até o foco — padrão comum em formulários de auth.
 */
export function AutofillGuardInput({ onFocus, readOnly, ...props }: AutofillGuardInputProps) {
  const [allowEdit, setAllowEdit] = useState(false)

  return (
    <Input
      {...props}
      readOnly={!allowEdit || readOnly}
      onFocus={(e) => {
        setAllowEdit(true)
        onFocus?.(e)
      }}
      data-1p-ignore={props.type === "password" ? true : undefined}
      data-lpignore="true"
    />
  )
}
