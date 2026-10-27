import * as React from "react"
import { Badge } from "@/components/ui/badge"

/**
 * Shared look for <Tabs> (client state) and <LinkTabs> (URL state). Lives
 * in a module without "use client" so Server Components can read the
 * class strings — values exported from a client module arrive on the
 * server as references, not strings.
 */

/** Shared look for tab lists — also used by LinkTabs. */
export const tabsListClassName =
  "relative flex h-11 w-full items-stretch border-b border-border md:gap-2"

/**
 * Scroll container around a tab list, so tabs that don't fit (count
 * badges at 360px, larger text) scroll sideways inside the strip instead
 * of widening the page. The list inside also gets `min-w-max`: full width
 * while the tabs fit, as wide as they need once they don't.
 * `contain-inline-size` keeps the tabs' width out of the parent's sizing,
 * so a grid or flex parent doesn't grow to fit them (the strip scrolls
 * instead). Triggers draw their focus ring inset and the indicator sits
 * on the list's own border, so the clipping edge cuts neither.
 */
export const tabsScrollClassName =
  "w-full min-w-0 contain-inline-size overflow-x-auto overflow-y-hidden overscroll-x-contain"

/** Shared look for one tab — `data-active` (client) or aria-current (links). */
export const tabsTriggerClassName =
  "relative inline-flex flex-1 items-center justify-center gap-1.5 px-3 text-label font-medium whitespace-nowrap text-muted-foreground outline-none select-none md:flex-none md:px-4 " +
  "transition-colors duration-(--duration-fast) ease-move hover:text-foreground " +
  "focus-visible:rounded-chip focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset " +
  "data-active:font-semibold data-active:text-primary aria-[current=page]:font-semibold aria-[current=page]:text-primary " +
  "disabled:pointer-events-none disabled:opacity-40"

/**
 * Renders the label twice in one grid cell — an invisible semibold copy
 * reserves the active width, so tabs don't shift when the weight changes.
 */
export function StableLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid">
      <span aria-hidden className="invisible col-start-1 row-start-1 font-semibold">
        {children}
      </span>
      <span className="col-start-1 row-start-1">{children}</span>
    </span>
  )
}

/**
 * A tab's count ("Pedidos 2"): a neutral badge — `count` (filled teal) is
 * for unread counts only — whose number is read with its noun, so the tab
 * says "Pedidos (2 por responder)" rather than "Pedidos 2".
 *
 *   badge: <TabCount count={2} label="2 por responder" />
 */
export function TabCount({ count, label }: { count: number; label: string }) {
  return (
    <Badge variant="neutral" className="tabular-nums">
      <span aria-hidden>{count}</span>
      <span className="sr-only"> ({label})</span>
    </Badge>
  )
}
