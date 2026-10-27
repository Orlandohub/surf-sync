import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * surfsync DS (COMPONENTS.md) — Badge.
 * Non-interactive metadata. Max 2 per card; never solid fill except `count`.
 * Status variants always pair with an icon or an unambiguous word.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-chip h-6 px-2 text-caption [&_svg]:size-3.5 [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-tint text-tint-foreground",
        neutral: "bg-muted text-muted-foreground",
        success: "bg-success-soft text-success-soft-foreground",
        warning: "bg-warning-soft text-warning-soft-foreground",
        destructive: "bg-danger-soft text-danger-soft-foreground",
        outline: "border border-border text-muted-foreground",
        count:
          "h-5 min-w-5 justify-center rounded-full px-1.5 bg-primary text-primary-foreground tabular-nums",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
