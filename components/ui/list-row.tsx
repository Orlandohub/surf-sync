import * as React from "react"
import Link from "next/link"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * surfsync DS — list rows (COMPONENTS.md "Lesson row", "Action banner",
 * "Menu row"). Server-component friendly.
 *
 * LinkRow   a whole-card link: the product's core unit (a lesson, a
 *           booking, an instructor). Title, meta line, optional badges,
 *           trailing ChevronRight. No secondary buttons inside it.
 * ActionBanner  the "Sincroniza a tua disponibilidade" nudge — one per
 *           screen, at the end of the content.
 * MenuGroup + MenuRow  settings/profile lists: rows grouped in one card,
 *           inset dividers, 52px rows.
 */

const rowFocus =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

/**
 * Whole-row link card.
 *
 *   <LinkRow
 *     href={`/instructor/bookings/${b.id}`}
 *     leading={<Avatar name={b.schoolName} />}
 *     title={b.schoolName}
 *     description={formatDayTimeRange(b.bookingDate, b.startTime, b.endTime)}
 *   >
 *     <Badge>Intermédio</Badge>
 *   </LinkRow>
 *
 * Children render as the badge row under the meta line (max 2 badges).
 * `trailing` sits before the chevron (a status badge, a count) from 640px;
 * on phones it leads the badge row instead.
 * `density="compact"` drops the 88px min height to 64px for dense lists
 * without thumbnails.
 */
function LinkRow({
  href,
  title,
  description,
  leading,
  trailing,
  children,
  density = "default",
  className,
}: {
  href: string
  title: React.ReactNode
  /** Meta line — "Amanhã · 9:00 · Carcavelos". */
  description?: React.ReactNode
  /** Thumbnail, avatar or <RowIcon>. */
  leading?: React.ReactNode
  /** Before the chevron: a status badge or a count. */
  trailing?: React.ReactNode
  /** Badge row under the meta line. */
  children?: React.ReactNode
  density?: "default" | "compact"
  className?: string
}) {
  return (
    <Link
      href={href}
      data-slot="link-row"
      className={cn(
        "flex items-center gap-3 rounded-card border bg-card p-card text-card-foreground shadow-card",
        "transition-[background-color,transform] duration-(--duration-fast) ease-move hover:bg-accent/50 active:scale-99",
        rowFocus,
        density === "default" ? "min-h-22" : "min-h-16",
        className
      )}
    >
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="line-clamp-2 text-label text-foreground">{title}</span>
        {description && (
          <span className="mt-0.5 line-clamp-2 text-meta text-muted-foreground tabular-nums">
            {description}
          </span>
        )}
        {(children || trailing) && (
          // On phones the trailing badge joins the badge row, so it never
          // squeezes the title and the date/time line.
          <span
            className={cn(
              "mt-1.5 flex flex-wrap items-center gap-1.5",
              !children && "sm:hidden"
            )}
          >
            {trailing && <span className="flex sm:hidden">{trailing}</span>}
            {children}
          </span>
        )}
      </span>
      {trailing && <span className="flex shrink-0 items-center max-sm:hidden">{trailing}</span>}
      <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
    </Link>
  )
}

/** Leading icon for a LinkRow when there's no photo: 44px tint circle. */
function RowIcon({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-11 items-center justify-center rounded-full bg-tint text-tint-foreground",
        className
      )}
    >
      <Icon aria-hidden className="size-5" strokeWidth={1.75} />
    </span>
  )
}

/**
 * The nudge card: 48px tint circle with the icon, title, one-line reason,
 * chevron. One per screen, after the person's own data. Not sand, not a
 * gradient.
 *
 *   <ActionBanner href="/instructor/availability" icon={CalendarWave}
 *     title="Sincroniza a tua disponibilidade"
 *     description="Mantém o calendário atualizado e recebe mais oportunidades." />
 */
function ActionBanner({
  href,
  icon: Icon,
  title,
  description,
  className,
}: {
  href: string
  icon: LucideIcon | React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
}) {
  return (
    <LinkRow
      href={href}
      density="compact"
      className={className}
      leading={
        <span className="flex size-12 items-center justify-center rounded-full bg-tint text-tint-foreground">
          <Icon aria-hidden className="size-6" strokeWidth={1.75} />
        </span>
      }
      title={title}
      description={description}
    />
  )
}

/**
 * Rows grouped in one card (Perfil, Conta, Definições).
 *
 *   <MenuGroup label="Conta">
 *     <MenuRow icon={UserRound} label="Perfil" href="/instructor/profile" />
 *     <MenuRow icon={Mail} label="Email" value={user.email} />
 *   </MenuGroup>
 *   <MenuGroup>
 *     <MenuRow icon={LogOut} label="Terminar sessão" destructive onClick={signOut} />
 *   </MenuGroup>
 */
function MenuGroup({
  label,
  className,
  children,
}: {
  /** Accessible name of the group (optional). */
  label?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <ul
      role="list"
      aria-label={label}
      data-slot="menu-group"
      className={cn("overflow-hidden rounded-card border bg-card shadow-card", className)}
    >
      {children}
    </ul>
  )
}

type MenuRowProps = {
  label: React.ReactNode
  icon?: LucideIcon
  /** Trailing muted value ("Ativo", an email, a count). */
  value?: React.ReactNode
  /** Navigates → renders a link with a chevron. */
  href?: string
  /** "Terminar sessão" and the like: `text-destructive`, no chevron, last in its own group. */
  destructive?: boolean
  className?: string
} & Omit<React.ComponentProps<"button">, "children" | "className">

/**
 * One 52px row. A link with `href` (chevron), a button with `onClick` or
 * `type="submit"` (no chevron), otherwise a static label/value row.
 */
function MenuRow({
  label,
  icon: Icon,
  value,
  href,
  destructive = false,
  className,
  ...buttonProps
}: MenuRowProps) {
  const inner = (
    <>
      {Icon && (
        <Icon
          aria-hidden
          data-slot="menu-row-icon"
          strokeWidth={1.75}
          className={cn("size-5 shrink-0", destructive ? "text-destructive" : "text-muted-foreground")}
        />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {value != null && (
        <span className="max-w-1/2 shrink-0 truncate text-meta text-muted-foreground tabular-nums">
          {value}
        </span>
      )}
      {href && !destructive && (
        <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
      )}
    </>
  )

  const rowClass = cn(
    "flex h-13 w-full items-center gap-3 px-card text-left text-body",
    destructive ? "text-destructive" : "text-foreground",
    className
  )
  const interactive = cn(
    rowClass,
    "cursor-pointer transition-colors duration-(--duration-fast) hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-40",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
  )
  const isButton = !href && (buttonProps.onClick != null || buttonProps.type != null)

  return (
    <li
      data-slot="menu-row"
      className={cn(
        "relative",
        // Inset divider: starts at the text, not the card edge.
        "not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:left-card not-first:before:h-px not-first:before:bg-border",
        "not-first:has-data-[slot=menu-row-icon]:before:left-12"
      )}
    >
      {href ? (
        <Link href={href} className={interactive}>
          {inner}
        </Link>
      ) : isButton ? (
        <button type="button" className={interactive} {...buttonProps}>
          {inner}
        </button>
      ) : (
        <div className={rowClass}>{inner}</div>
      )}
    </li>
  )
}

export { LinkRow, RowIcon, ActionBanner, MenuGroup, MenuRow }
