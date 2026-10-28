import * as React from "react";
import { useTranslations } from "next-intl";
import { Bell, CalendarCheck, CalendarPlus, CalendarX } from "lucide-react";
import type { IconComponent } from "@/components/brand/icons";
import type { NotificationItem } from "@/lib/services/notifications";
import type { BookingList } from "@/lib/booking-view";
import { NotificationGroup, NotificationRow } from "@/components/ui/list-row";
import { SectionHeading } from "@/components/ui/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarkAllReadButton } from "@/components/shell/mark-all-read-button";
import { formatRelativeDay, formatTime, groupNotifications } from "@/lib/format";
import { cn } from "@/lib/utils";

/** How many recent notifications a section lists. */
const LIMIT = 15;

/** The h2's id: the target of <NotificationsJump> and of aria-labelledby. */
export const NOTIFICATIONS_HEADING_ID = "notificacoes";
const SECTION_ID = "notificacoes-secao";

/** One glyph per booking event, the same on both sides. */
const ICONS: Record<string, IconComponent> = {
  booking_requested: CalendarPlus,
  booking_accepted: CalendarCheck,
  booking_declined: CalendarX,
  booking_cancelled: CalendarX,
};

/**
 * Notificações, the same section on both bookings screens (instructor
 * Aulas, school Reservas): the h2 with "N por ler" and "Marcar tudo como
 * lido", then the latest notifications grouped Hoje · Ontem · Esta semana
 * · Anteriores (actor in semibold, unread dot, an icon per event), or a
 * quiet card when there are none. The area supplies only its words: each
 * notification's sentence (`message`) and the empty sentence.
 *
 * Links: a notification opens the list its booking is in *now*
 * (`placeOf`, booking id → list, from the page's own bookings, through
 * `listHref`): a request accepted since opens the upcoming lessons, not an
 * empty requests tab. A booking the page doesn't know (an old payload
 * without its id) isn't a link: there is nowhere true to send it.
 *
 *   <NotificationsSection
 *     notifications={notifications}
 *     unread={unread}
 *     empty={t("notifications.empty")}
 *     message={(n) => t.rich(…)}
 *     placeOf={new Map(bookings.map((b) => [b.id, bookingList(b, today)]))}
 *     listHref={{ requests: "/instructor/bookings?tab=requests", upcoming: …, history: … }}
 *   />
 *
 * A server component (it takes a function); only "Marcar tudo como lido"
 * runs on the client. The section takes focus (tabIndex -1) when that
 * button disappears. Copy: UI.notifications.
 */
export function NotificationsSection({
  notifications,
  unread,
  empty,
  message,
  placeOf,
  listHref,
  limit = LIMIT,
  className,
}: {
  /** Newest first (listNotifications). */
  notifications: NotificationItem[];
  unread: number;
  /** One sentence: why it's empty and what will show up here. */
  empty: React.ReactNode;
  /** The notification's sentence, in the area's words. */
  message: (n: NotificationItem) => React.ReactNode;
  /** Booking id → the list that booking is in today. */
  placeOf: ReadonlyMap<string, BookingList>;
  /** Where each list lives on this side (its tab URL). */
  listHref: Record<BookingList, string>;
  limit?: number;
  className?: string;
}) {
  const t = useTranslations("UI.notifications");
  const items = notifications.slice(0, limit);
  const now = new Date();

  return (
    <section
      id={SECTION_ID}
      tabIndex={-1}
      aria-labelledby={NOTIFICATIONS_HEADING_ID}
      className={cn("flex flex-col gap-3 outline-none", className)}
    >
      <SectionHeading
        id={NOTIFICATIONS_HEADING_ID}
        title={t("title")}
        description={items.length > 0 ? t("unread", { count: unread }) : undefined}
        action={unread > 0 ? <MarkAllReadButton focusAfter={SECTION_ID} /> : undefined}
      />
      {items.length === 0 ? (
        <p className="rounded-card border bg-card p-card text-body text-muted-foreground shadow-card">
          {empty}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {groupNotifications(items, (n) => n.createdAt, { now }).map(({ group, items }) => (
            <NotificationGroup key={group} group={group}>
              {items.map((n) => {
                const place = placeOf.get(payloadText(n.payload.bookingId));
                return (
                  <NotificationRow
                    key={n.id}
                    icon={ICONS[n.type] ?? Bell}
                    href={place ? listHref[place] : undefined}
                    at={n.createdAt}
                    now={now}
                    unread={!n.readAt}
                  >
                    {message(n)}
                  </NotificationRow>
                );
              })}
            </NotificationGroup>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * The bell in a bookings screen's header, below lg only: on phones the
 * notifications sit after the list (a stable order), so this jumps to
 * them. The count is the unread one, read in the link's name.
 *
 *   <PageHeader title="Aulas" action={<NotificationsJump unread={unread} />} />
 */
export function NotificationsJump({ unread }: { unread: number }) {
  const t = useTranslations("UI.notifications");
  return (
    <a
      href={`#${NOTIFICATIONS_HEADING_ID}`}
      aria-label={t("jump", { count: unread })}
      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative lg:hidden")}
    >
      <Bell aria-hidden strokeWidth={1.75} />
      {unread > 0 && (
        <Badge variant="count" aria-hidden className="absolute -top-0.5 -right-0.5">
          {unread}
        </Badge>
      )}
    </a>
  );
}

/**
 * A notification payload's lesson day, mid-sentence ("amanhã", "sábado",
 * "5 de novembro"), or null when it has none or it isn't a date.
 */
export function payloadDay(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  try {
    return formatRelativeDay(value, { lowercase: true });
  } catch {
    return null;
  }
}

/** A payload's start time ("8:30"), or null (older notifications have none). */
export function payloadTime(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return null;
  try {
    return formatTime(value);
  } catch {
    return null;
  }
}

/** A payload string field, or "" when absent. */
export const payloadText = (value: unknown): string => (typeof value === "string" ? value : "");
