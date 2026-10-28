import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * surfsync DS — section head inside a page ("Próximas aulas",
 * "Estatísticas"): `text-title-sm`, optional muted description, optional
 * trailing action — usually a <SectionLink> ("Ver todas"), which moves
 * under the title when the two don't fit on one line.
 * Sections stack with `gap-section`; heading → content is `gap-3`.
 *
 *   <section className="flex flex-col gap-3">
 *     <SectionHeading title="Próximas aulas" action={<SectionLink href="/instructor/bookings">Ver todas</SectionLink>} />
 *     …rows…
 *   </section>
 */
function SectionHeading({
  title,
  description,
  action,
  as: Heading = "h2",
  id,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  as?: "h2" | "h3"
  /** Put an id here and aria-labelledby on the <section>. */
  id?: string
  className?: string
}) {
  return (
    <div
      data-slot="section-heading"
      // The action drops under the title when both don't fit on one line
      // (large text on a phone) instead of widening the page.
      className={cn("flex flex-wrap items-end justify-between gap-x-4 gap-y-1", className)}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <Heading id={id} className="text-title-sm text-foreground">
          {title}
        </Heading>
        {description && <p className="text-meta text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex max-w-full items-center">{action}</div>}
    </div>
  )
}

/** "Ver todas ›" — teal text link for a section's trailing action. */
function SectionLink({
  href,
  children,
  className,
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "tap inline-flex items-center gap-0.5 rounded-chip text-meta font-semibold text-primary underline-offset-4 hover:underline",
        className
      )}
    >
      {children}
      <ChevronRight aria-hidden className="size-4" strokeWidth={1.75} />
    </Link>
  )
}

export { SectionHeading, SectionLink }
