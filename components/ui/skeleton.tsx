import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * surfsync DS (COMPONENTS.md "Loading") — skeletons that match the real
 * shapes. Spinners only inside a pending button; never a full-screen
 * spinner. Use in `loading.tsx` files and Suspense fallbacks.
 *
 *   <Skeleton className="h-6 w-40" />            // a title
 *   <SkeletonRow />                              // a lesson/link row
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

/** Placeholder for a <LinkRow> with a thumbnail: same height and rhythm. */
function SkeletonRow({ thumbnail = true, className }: { thumbnail?: boolean; className?: string }) {
  return (
    <div
      data-slot="skeleton-row"
      aria-hidden
      className={cn(
        "flex min-h-22 items-center gap-3 rounded-card border bg-card p-card shadow-card",
        className
      )}
    >
      {thumbnail && <Skeleton className="size-14 shrink-0 rounded-thumb" />}
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
    </div>
  )
}

export { Skeleton, SkeletonRow }
