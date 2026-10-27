import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

/**
 * surfsync DS (COMPONENTS.md "Stat tile"). Value `text-headline
 * text-primary tabular-nums`, label `text-meta` muted below. Lay out two-up:
 * `<div className="grid grid-cols-2 gap-stack">` (4-up from md if needed).
 *
 *   <StatTile value={3} label="Pedidos por responder" href="/instructor/bookings" />
 *   <StatTile value="12" label="Aulas este mês" />
 *
 * Only real numbers — never placeholder stats. The label names the period
 * when there is one ("este mês"). Optional `trend` slot for a sparkline.
 * With `href` the whole tile is the link.
 */
function StatTile({
  value,
  label,
  href,
  trend,
  className,
}: {
  value: React.ReactNode
  label: React.ReactNode
  href?: string
  trend?: React.ReactNode
  className?: string
}) {
  const classes = cn(
    "flex min-h-22 flex-col justify-between gap-1 rounded-card border bg-card p-card text-left shadow-card",
    href &&
      "transition-[background-color,transform] duration-(--duration-fast) ease-move hover:bg-accent/50 active:scale-99",
    className
  )
  const content = (
    <>
      <span className="text-headline text-primary tabular-nums">{value}</span>
      <span className="text-meta text-muted-foreground">{label}</span>
      {trend && <span className="mt-2">{trend}</span>}
    </>
  )
  return href ? (
    <Link href={href} data-slot="stat-tile" className={classes}>
      {content}
    </Link>
  ) : (
    <div data-slot="stat-tile" className={classes}>
      {content}
    </div>
  )
}

export { StatTile }
