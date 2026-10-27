import * as React from "react"
import { cn } from "@/lib/utils"

/** surfsync DS — Textarea, same recipe as the text field (COMPONENTS.md). */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-control border border-input bg-card px-4 py-3 text-body-lg text-foreground transition-[border-color,box-shadow] duration-(--duration-fast) outline-none placeholder:text-placeholder focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
