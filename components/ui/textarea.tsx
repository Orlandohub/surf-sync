"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { controlClassName } from "@/components/ui/control"
import { useFieldControlProps } from "@/components/ui/field"

/**
 * surfsync DS — Textarea, same recipe as the text field (COMPONENTS.md).
 * Grows with its content from `min-h-24`. Use inside <Field>.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  const fieldProps = useFieldControlProps(props)
  return (
    <textarea
      data-slot="textarea"
      className={cn(controlClassName, "flex field-sizing-content min-h-24 px-4 py-3", className)}
      {...fieldProps}
    />
  )
}

export { Textarea }
