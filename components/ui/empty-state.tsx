import * as React from "react"
import type { IconComponent } from "@/components/brand/icons"
import { cn } from "@/lib/utils"
import { LogoMark } from "@/components/brand/logo"

/**
 * surfsync DS (COMPONENTS.md "Empty state"). An invitation to act.
 * Centred, narrow: optional icon in a tint circle, title `text-title-sm`,
 * body `text-body` muted (≤ 2 lines: why it's empty + what to do), one
 * action — primary if it's the only action on the screen, else outline.
 *
 *   <EmptyState
 *     icon={CalendarDays}
 *     title="Ainda não tens aulas marcadas"
 *     description="Define a tua disponibilidade para começares a receber oportunidades."
 *     action={<Link href="/instructor/availability" className={buttonVariants()}>Definir disponibilidade</Link>}
 *   />
 *
 * `surface="card"` (default) draws it as a card for list areas; use
 * `surface="none"` inside an existing card (never a card in a card).
 * `mark` adds the cropped wave mark at ≤ 8 % contrast behind — brand
 * device for first-run screens, not for routine empty lists.
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  surface = "card",
  mark = false,
  as: Title = "h2",
  className,
}: {
  icon?: IconComponent
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  surface?: "card" | "none"
  mark?: boolean
  /** Heading level of the title; "h1" when it is the whole page (404),
   *  "h3" under a section heading, "p" for none. */
  as?: "h1" | "h2" | "h3" | "p"
  className?: string
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "relative isolate flex flex-col items-center overflow-hidden px-card py-10 text-center",
        surface === "card" && "rounded-card border bg-card shadow-card",
        className
      )}
    >
      {mark && (
        <LogoMark
          size={224}
          className="pointer-events-none absolute -top-16 -right-20 -z-10 text-foreground opacity-5"
        />
      )}
      {Icon && (
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-tint text-tint-foreground">
          <Icon aria-hidden className="size-6" strokeWidth={1.75} />
        </span>
      )}
      {/* w-full: never wider than the card's padding box, so at 200% text
          a long word breaks and the action's label wraps inside it instead
          of running to the card's edge. Centred text looks the same. */}
      <Title className="w-full max-w-xs text-title-sm text-balance wrap-break-word hyphens-auto text-foreground">
        {title}
      </Title>
      {description && (
        <p className="mt-1.5 w-full max-w-xs text-body text-pretty wrap-break-word hyphens-auto text-muted-foreground">
          {description}
        </p>
      )}
      {/* A size container: under 16rem (200% text on a phone) the action
          gives its side padding and its decorative arrow to the label. */}
      {action && (
        <div className="@container mt-5 flex w-full justify-center @max-3xs:*:px-3 @max-3xs:[&_svg]:hidden">
          {action}
        </div>
      )}
    </div>
  )
}

export { EmptyState }
