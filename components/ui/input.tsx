"use client"

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"
import { controlClassName } from "@/components/ui/control"
import { useFieldControlProps } from "@/components/ui/field"

/**
 * surfsync DS (COMPONENTS.md "Text field") — Input.
 * `h-12 rounded-control px-4 text-body-lg`, card fill. Put it inside
 * <Field label=…> for the visible label, helper and inline error — the
 * Field wires id / aria-describedby / aria-invalid onto it.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const fieldProps = useFieldControlProps(props)
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        controlClassName,
        "h-12 px-4 file:mr-3 file:border-0 file:bg-transparent file:text-label file:text-foreground",
        className
      )}
      {...fieldProps}
    />
  )
}

export { Input }
