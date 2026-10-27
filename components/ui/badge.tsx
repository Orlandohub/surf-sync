import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * surfsync DS (COMPONENTS.md) — Badge.
 * Non-interactive metadata. Max 2 per card; never solid fill except `count`.
 * Status variants always pair with an icon or an unambiguous word.
 *
 * Never wider than its container: one line looks as always (24px), but a
 * label longer than the row ("Por responder" at 200% text on a phone)
 * wraps inside the badge, which grows taller, instead of running past the
 * card's edge. `count` is a number and never wraps.
 */
const badgeVariants = cva(
  "inline-flex w-fit max-w-full min-h-6 shrink-0 items-center gap-1 rounded-chip px-2 py-0.5 text-left text-caption wrap-break-word [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
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
          "h-5 min-h-0 min-w-5 justify-center whitespace-nowrap rounded-full px-1.5 py-0 bg-primary text-primary-foreground tabular-nums",
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
