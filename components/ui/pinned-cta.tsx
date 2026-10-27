"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { FieldError } from "@/components/ui/field"

/** Where the bar stops being pinned and becomes an ordinary row. */
const INLINE = {
  md: "md:static md:z-auto md:min-h-0 md:bg-transparent md:p-0 md:before:hidden",
  lg: "lg:static lg:z-auto lg:min-h-0 lg:bg-transparent lg:p-0 lg:before:hidden",
} as const

/**
 * surfsync DS (COMPONENTS.md "Button": a full-width lg primary pinned at
 * the bottom of a screen sits on bg-background with px-gutter pb-4, above
 * the tab bar; DESIGN.md "One job per screen").
 *
 * Below `until` (md by default, or lg) the bar is fixed right above the
 * bottom chrome (tab bar + home indicator): full-bleed, top hairline,
 * `min-h-cta` (80 px: pt-3 + Button size lg + pb-4), the same everywhere.
 * From `until` it is an ordinary row where it sits in the form, actions
 * right-aligned. While it is pinned globals.css adds it to
 * --bottom-clearance, so the page's bottom padding, the focus
 * scroll-margin and the toasts all clear it; no scroll-mb or toast
 * offsets in the screen.
 *
 *   <PinnedCta until="lg" error={formError}>
 *     <Button type="submit" size="lg" pending={saving} pendingLabel="A guardar…" className="md:w-auto lg:h-11">
 *       Guardar alterações
 *     </Button>
 *   </PinnedCta>
 *
 * - Use Button size="lg" so the bar keeps its height; it is full width
 *   below md. Shrink it only from `until` (e.g. `lg:h-11`), where it is
 *   no longer pinned.
 * - `error`: the form-level error (role="alert"), shown beside the button
 *   so it's seen wherever the person is in the form. The bar grows with
 *   it and reports its height (--pinned-cta-height).
 * - One per screen. Its place in the DOM is its tab order: put it after
 *   the fields it submits (outside the <form>, use form={id}).
 * - Not inside a transformed or filtered ancestor (transform, scale,
 *   animate-rise, filter, glass/backdrop-filter): position: fixed would
 *   then follow that ancestor instead of the viewport.
 */
function PinnedCta({
  until = "md",
  error,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** Breakpoint from which the bar is inline instead of pinned. */
  until?: keyof typeof INLINE
  /** Form-level error (role="alert"); pass it only while there is one. */
  error?: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  // The bar is --spacing-cta tall until something (an error) makes it
  // taller; report the real height so the clearance stays exact.
  React.useEffect(() => {
    const bar = ref.current
    if (!bar) return
    const root = document.documentElement
    const observer = new ResizeObserver(() => {
      root.style.setProperty("--pinned-cta-height", `${bar.getBoundingClientRect().height}px`)
    })
    observer.observe(bar)
    return () => {
      observer.disconnect()
      root.style.removeProperty("--pinned-cta-height")
    }
  }, [])

  return (
    <div
      ref={ref}
      data-slot="pinned-cta"
      data-pinned-cta={until}
      className={cn(
        "fixed inset-x-0 bottom-(--bottom-chrome) z-30 flex min-h-cta flex-col justify-center gap-3 bg-background px-gutter pt-3 pb-4",
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-border",
        "md:flex-row md:items-center md:justify-end",
        INLINE[until],
        className
      )}
      {...props}
    >
      {error && <FieldError className="md:mr-auto">{error}</FieldError>}
      {children}
    </div>
  )
}

export { PinnedCta }
