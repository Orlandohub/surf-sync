import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * surfsync DS (COMPONENTS.md "Loading") — skeletons that match the real
 * shapes. Spinners only inside a pending button; never a full-screen
 * spinner. Use in `loading.tsx` files and Suspense fallbacks.
 *
 *   <Skeleton className="h-6 w-40" />            // a title
 *   <SkeletonRow />                              // a row with an avatar
 *   <SkeletonRow leading="thumb" />              // a lesson row with a photo
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-pulse rounded-chip bg-muted", className)}
      {...props}
    />
  )
}

/**
 * Placeholder for a <LinkRow>/<ItemRow>: same card, height and rhythm.
 * `leading` mirrors the real row so nothing shifts when it loads:
 * "avatar" (44px circle — Avatar or RowIcon, the default), "thumb" (72px
 * lesson photo), or "none".
 */
function SkeletonRow({
  leading = "avatar",
  className,
}: {
  leading?: "avatar" | "thumb" | "none"
  className?: string
}) {
  return (
    <div
      data-slot="skeleton-row"
      aria-hidden
      className={cn(
        "flex min-h-22 items-center gap-3 rounded-card border bg-card p-card shadow-card",
        className
      )}
    >
      {leading === "avatar" && <Skeleton className="size-11 shrink-0 rounded-full" />}
      {leading === "thumb" && <Skeleton className="size-18 shrink-0 rounded-thumb" />}
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
    </div>
  )
}

export { Skeleton, SkeletonRow }
