"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { controlClassName } from "@/components/ui/control"
import { useFieldControlProps } from "@/components/ui/field"

/**
 * surfsync DS — Select. A styled native <select>: the text-field recipe
 * (h-12, rounded-control, text-body-lg) with a muted ChevronDown. Native
 * on purpose — the OS picker is the most usable one on a phone, it works
 * with forms and Server Actions, and it is accessible for free.
 *
 *   <Field label="Zona">
 *     <Select name="location" defaultValue="">
 *       <option value="">Qualquer zona</option>
 *       {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
 *     </Select>
 *   </Field>
 *
 * `className` goes on the wrapper (width/layout); the select fills it.
 */
function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  const fieldProps = useFieldControlProps(props)
  return (
    <div data-slot="select" className={cn("relative w-full", className)}>
      <select
        data-slot="select-control"
        className={cn(
          controlClassName,
          "h-12 cursor-pointer appearance-none truncate pr-11 pl-4 tabular-nums"
        )}
        {...fieldProps}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        strokeWidth={1.75}
        className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}

export { Select }
