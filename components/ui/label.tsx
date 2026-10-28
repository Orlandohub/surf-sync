import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * surfsync DS (COMPONENTS.md "Text field") — Label.
 * Above the control, `text-meta font-medium`, always visible. Prefer
 * <Field label=…>, which renders this and wires the control.
 */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-meta font-medium text-foreground select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
