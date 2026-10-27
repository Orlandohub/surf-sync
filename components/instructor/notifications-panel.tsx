import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  Bell,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  CalendarX2,
  ShieldAlert,
} from "lucide-react";
import type { IconComponent } from "@/components/brand/icons";
import type { NotificationItem } from "@/lib/services/notifications";
import { NotificationGroup, NotificationRow } from "@/components/ui/list-row";
import { SectionHeading } from "@/components/ui/section-heading";
import { MarkAllReadButton } from "@/components/instructor/mark-all-read-button";
import { formatRelativeDay, groupNotifications } from "@/lib/format";

/** How many recent notifications the panel lists. */
const LIMIT = 15;

const ICONS: Record<string, IconComponent> = {
  booking_requested: CalendarPlus,
  booking_accepted: CalendarCheck,
  booking_declined: CalendarX,
  booking_cancelled: CalendarX2,
  verification_approved: BadgeCheck,
  verification_rejected: ShieldAlert,
};

type MessageKey =
  | "booking_requested"
  | "booking_accepted"
  | "booking_declined"
  | "booking_cancelled"
  | "verification_approved"
  | "verification_rejected"
  | "other";

const BOOKING_TYPES = new Set(["booking_requested", "booking_accepted", "booking_declined", "booking_cancelled"]);

/** "sábado", "amanhã", "5 de novembro" — or null when the payload has no usable date. */
function lessonDay(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  try {
    return formatRelativeDay(value, { lowercase: true });
  } catch {
    // Out-of-range date in an old payload: show the generic sentence instead.
    return null;
  }
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
        action={unread > 0 ? <MarkAllReadButton /> : undefined}
      />
      {items.length === 0 ? (
        <p className="text-body text-muted-foreground">{t("empty")}</p>
      ) : (
        groupNotifications(items, (n) => n.createdAt, { now }).map(({ group, items }) => (
          <NotificationGroup key={group} group={group}>
            {items.map((n) => {
              const school = typeof n.payload.schoolName === "string" ? n.payload.schoolName : "";
              const day = lessonDay(n.payload.bookingDate);
              const key: MessageKey =
                BOOKING_TYPES.has(n.type) && (!day || !school)
                  ? "other"
                  : n.type in ICONS
                    ? (n.type as MessageKey)
                    : "other";
              return (
                <NotificationRow
                  key={n.id}
                  icon={ICONS[n.type] ?? Bell}
                  at={n.createdAt}
                  now={now}
                  unread={!n.readAt}
                >
                  {t.rich(`types.${key}`, {
                    school,
                    day: day ?? "",
                    strong: (chunks) => <strong>{chunks}</strong>,
                  })}
                </NotificationRow>
              );
            })}
          </NotificationGroup>
        ))
      )}
    </section>
  );
}
