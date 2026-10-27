import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { IconComponent } from "@/components/brand/icons"
import {
  formatNotificationTime,
  type Instant,
  type NotificationGroup as NotificationGroupKey,
} from "@/lib/format"

/**
 * surfsync DS — list rows (COMPONENTS.md "Lesson row", "Action banner",
 * "Menu row", "Notification row"). Server-component friendly.
 *
 * LinkRow   a whole-card link: the product's core unit (a lesson, an
 *           instructor, anything with its own page). Title, meta line,
 *           optional badges, trailing ChevronRight. No buttons inside it.
 * ItemRow   the same anatomy, not a link, with an `actions` slot — for
 *           items acted on in place (a booking request: Recusar · Aceitar).
 * ActionBanner  the "Sincroniza a tua disponibilidade" nudge — one per
 *           screen, at the end of the content.
 * MenuGroup + MenuRow  settings/profile lists: rows grouped in one card,
 *           inset dividers, 52px rows.
 * NotificationGroup + NotificationRow  activity lists grouped by day.
 *
 * Badges: at most 2 per row, status included (COMPONENTS.md "Badge") —
 * e.g. status + level; put the duration in the meta line instead
 * ("Amanhã · 9:00–11:00").
 */

const rowFocus =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

/**
 * Whole-row link card.
 *
 *   <LinkRow
 *     href={`/school/discovery/${i.id}`}
 *     leading={<Avatar name={i.name} src={i.photoUrl} />}
 *     title={i.name}
 *     description={i.zones.join(" · ")}
 *     trailing={<StatusBadge tone="success" icon={BadgeCheck}>Disponível</StatusBadge>}
 *   >
 *     <Badge>Intermédio</Badge>
 *   </LinkRow>
 *
 * Children render as the badge row under the meta line; with `trailing`
 * that's 2 badges at most in total. `trailing` sits before the chevron (a
 * status badge, a count) from 640px; on phones it leads the badge row
 * instead — it is rendered in both places (one hidden), so pass a plain
 * element: no `id`, no state.
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

/**
 * A card row that is not a link, with actions — the booking request an
 * instructor answers, the booking a school can cancel. Same anatomy as
 * LinkRow (leading, title, meta, badge row); `status` leads the badge row.
 * Actions sit on the right from 640px and share a full-width row under
 * the content on phones. Put the dismissive action first and the primary
 * last (primary ends up on the right); consequential ones open a
 * <ConfirmDialog>.
 *
 *   <ItemRow
 *     leading={<Avatar name={b.schoolName} />}
 *     title={b.schoolName}
 *     description={formatDayTimeRange(b.bookingDate, b.startTime, b.endTime)}
 *     status={<StatusBadge tone={bookingStatusTone(b.status)} icon={bookingStatusIcon(b.status)}>{t(`status.${b.status}`)}</StatusBadge>}
 *     actions={<>
 *       <ConfirmDialog trigger={<Button variant="outline" size="sm">Recusar</Button>} … />
 *       <Button size="sm" pending={accepting} pendingLabel="A aceitar…" onClick={accept}>Aceitar</Button>
 *     </>}
 *   >
 *     <Badge>Iniciante</Badge>
 *   </ItemRow>
 *
 * Several rows with a primary each are fine in a list (one decision per
 * row); keep `size="sm"` so they stay quiet.
 */
function ItemRow({
  title,
  description,
  leading,
  status,
  actions,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode
  /** Meta line — "Amanhã · 9:00–11:00". */
  description?: React.ReactNode
  /** Avatar or <RowIcon>. */
  leading?: React.ReactNode
  /** Status badge, first in the badge row. */
  status?: React.ReactNode
  /** One or two buttons. */
  actions?: React.ReactNode
  /** More badges (2 in total with the status) or a short note. */
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="item-row"
      className={cn(
        "flex flex-col gap-4 rounded-card border bg-card p-card text-card-foreground shadow-card sm:flex-row sm:items-center",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {leading && <span className="flex shrink-0 items-center">{leading}</span>}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="line-clamp-2 text-label text-foreground">{title}</span>
          {description && (
            <span className="mt-0.5 text-meta text-muted-foreground tabular-nums">{description}</span>
          )}
          {(status || children) && (
            <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {status}
              {children}
            </span>
          )}
        </div>
      </div>
      {actions && (
        <div data-slot="item-row-actions" className="flex gap-2 *:flex-1 sm:shrink-0 sm:*:flex-none">
          {actions}
        </div>
      )}
    </div>
  )
}

/** Leading icon for a row when there's no photo: 44px tint circle. */
function RowIcon({ icon: Icon, className }: { icon: IconComponent; className?: string }) {
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
  icon: IconComponent
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
  icon?: IconComponent
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

/**
 * A day group of notifications: "Hoje", "Ontem", "Esta semana",
 * "Anteriores" (`text-meta font-semibold` muted) over one card of rows.
 *
 *   {groupNotifications(items, (n) => n.createdAt).map(({ group, items }) => (
 *     <NotificationGroup key={group} group={group}>
 *       {items.map((n) => <NotificationRow key={n.id} … />)}
 *     </NotificationGroup>
 *   ))}
 */
function NotificationGroup({
  group,
  label,
  className,
  children,
}: {
  /** From `notificationGroup()` / `groupNotifications()` — labelled for you. */
  group?: NotificationGroupKey
  /** Or your own heading. */
  label?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  const t = useTranslations("UI.notificationGroups")
  const headingId = React.useId()
  const heading = label ?? (group ? t(group) : null)
  return (
    <section
      data-slot="notification-group"
      aria-labelledby={heading ? headingId : undefined}
      className={cn("flex flex-col gap-2", className)}
    >
      {heading && (
        <h3 id={headingId} className="text-meta font-semibold text-muted-foreground">
          {heading}
        </h3>
      )}
      <ul role="list" className="overflow-hidden rounded-card border bg-card shadow-card">
        {children}
      </ul>
    </section>
  )
}

/**
 * One notification: 36px tint circle with the event icon (or an avatar via
 * `leading`), the sentence in `text-body` — wrap the actor's name in
 * <strong> (rendered semibold) — and the time below in `text-caption`
 * ("há 5 min", "Hoje · 14:30"). Unread rows get a 6px teal dot before the
 * time and an sr-only "Não lida" — no background highlight. With `href`
 * the whole row is a link.
 *
 *   <NotificationRow icon={CalendarCheck} at={n.createdAt} unread={!n.readAt}>
 *     {t.rich("requested", { school: n.schoolName, strong: (c) => <strong>{c}</strong> })}
 *   </NotificationRow>
 */
function NotificationRow({
  icon: Icon,
  leading,
  at,
  now,
  unread = false,
  href,
  className,
  children,
}: {
  icon?: IconComponent
  /** Replaces the icon circle (e.g. <Avatar size={32} …/>). */
  leading?: React.ReactNode
  /** When it happened (an instant, shown in Lisbon time). */
  at: Instant
  /** Pin "now" (tests, or one value for a whole list). */
  now?: Instant
  unread?: boolean
  href?: string
  className?: string
  children: React.ReactNode
}) {
  const t = useTranslations("UI")
  const instant = at instanceof Date ? at : new Date(at)
  const body = (
    <>
      {leading ?? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tint text-tint-foreground">
          {Icon && <Icon aria-hidden className="size-5" strokeWidth={1.75} />}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-body text-foreground [&_strong]:font-semibold">{children}</span>
        <span className="flex items-center gap-1.5 text-caption text-muted-foreground tabular-nums">
          {unread && (
            <>
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="sr-only">{t("unread")}</span>
            </>
          )}
          {/* Relative time ("há 5 min") can tick between server and client. */}
          <time dateTime={instant.toISOString()} suppressHydrationWarning>
            {formatNotificationTime(instant, now === undefined ? {} : { now })}
          </time>
        </span>
      </span>
      {href && (
        <ChevronRight aria-hidden className="size-5 shrink-0 self-center text-muted-foreground" strokeWidth={1.75} />
      )}
    </>
  )
  const rowClass = cn("flex w-full items-start gap-3 px-card py-3.5 text-left", className)
  return (
    <li
      data-slot="notification-row"
      data-unread={unread || undefined}
      className="relative not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:left-16 not-first:before:h-px not-first:before:bg-border"
    >
      {href ? (
        <Link
          href={href}
          className={cn(
            rowClass,
            "transition-colors duration-(--duration-fast) hover:bg-accent/50",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          )}
        >
          {body}
        </Link>
      ) : (
        <div className={rowClass}>{body}</div>
      )}
    </li>
  )
}

export {
  LinkRow,
  ItemRow,
  RowIcon,
  ActionBanner,
  MenuGroup,
  MenuRow,
  NotificationGroup,
  NotificationRow,
}
