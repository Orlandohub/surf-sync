import { useTranslations } from "next-intl";
import { Bell, CalendarPlus, CalendarX2 } from "lucide-react";
import type { IconComponent } from "@/components/brand/icons";
import type { NotificationItem } from "@/lib/services/notifications";
import { NotificationGroup, NotificationRow } from "@/components/ui/list-row";
import { SectionHeading } from "@/components/ui/section-heading";
import { MarkAllReadButton } from "@/components/instructor/mark-all-read-button";
import { formatRelativeDay, formatTime, groupNotifications } from "@/lib/format";

/** How many recent notifications the panel lists. */
const LIMIT = 15;

/**
 * What an instructor is notified about (lib/services/booking.ts): a school
 * asked for a lesson, or cancelled one. Anything else gets the generic
 * sentence. Each links to the Aulas tab where that booking now is.
 */
const TYPES = {
  booking_requested: { icon: CalendarPlus, href: "/instructor/bookings?tab=requests" },
  booking_cancelled: { icon: CalendarX2, href: "/instructor/bookings?tab=history" },
} satisfies Record<string, { icon: IconComponent; href: string }>;

type BookingType = keyof typeof TYPES;

const isBookingType = (type: string): type is BookingType => type in TYPES;

/** "sábado", "amanhã", "5 de novembro", or null when the payload has no date. */
function lessonDay(value: unknown): string | null {
  // A Postgres date column, so a well-formed date when present.
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return formatRelativeDay(value, { lowercase: true });
}

/** "8:30", or null when the payload has no start time (older notifications). */
function lessonTime(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return null;
  return formatTime(value);
}

/**
 * Notificações for the instructor — grouped Hoje · Ontem · Esta semana ·
 * Anteriores, the school's name in semibold, unread dots. Server
 * component; only "Marcar tudo como lido" runs on the client.
 */
export function NotificationsPanel({
  notifications,
  unread,
}: {
  notifications: NotificationItem[];
  unread: number;
}) {
  const t = useTranslations("InstructorBookingsPage.notifications");
  const items = notifications.slice(0, LIMIT);
  const now = new Date();

  return (
    <section aria-labelledby="notificacoes" className="flex flex-col gap-3">
      <SectionHeading
        id="notificacoes"
        title={t("title")}
        description={notifications.length > 0 ? t("unread", { count: unread }) : undefined}
        action={unread > 0 ? <MarkAllReadButton headingId="notificacoes" /> : undefined}
      />
      {items.length === 0 ? (
        <p className="text-body text-muted-foreground">{t("empty")}</p>
      ) : (
        groupNotifications(items, (n) => n.createdAt, { now }).map(({ group, items }) => (
          <NotificationGroup key={group} group={group}>
            {items.map((n) => {
              const school = typeof n.payload.schoolName === "string" ? n.payload.schoolName : "";
              const day = lessonDay(n.payload.bookingDate);
              const time = lessonTime(n.payload.startTime);
              const type = isBookingType(n.type) && day && school ? n.type : null;
              return (
                <NotificationRow
                  key={n.id}
                  icon={type ? TYPES[type].icon : Bell}
                  href={type ? TYPES[type].href : undefined}
                  at={n.createdAt}
                  now={now}
                  unread={!n.readAt}
                >
                  {type
                    ? t.rich(`types.${type}${time ? "_at" : ""}`, {
                        school,
                        day: day ?? "",
                        time: time ?? "",
                        strong: (chunks) => <strong>{chunks}</strong>,
                      })
                    : t("types.other")}
                </NotificationRow>
              );
            })}
          </NotificationGroup>
        ))
      )}
    </section>
  );
}
