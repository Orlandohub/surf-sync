import { getTranslations } from "next-intl/server";
import { Bell, CalendarCheck, CalendarPlus, CalendarX } from "lucide-react";
import type { IconComponent } from "@/components/brand/icons";
import { NotificationGroup, NotificationRow } from "@/components/ui/list-row";
import { SectionHeading } from "@/components/ui/section-heading";
import { MarkAllReadButton } from "@/components/school/mark-all-read-button";
import { formatRelativeDay, groupNotifications } from "@/lib/format";
import type { NotificationItem } from "@/lib/services/notifications";
import type { BookingTab } from "@/components/school/booking-groups";
import { cn } from "@/lib/utils";

const ICONS: Record<string, IconComponent> = {
  booking_requested: CalendarPlus,
  booking_accepted: CalendarCheck,
  booking_declined: CalendarX,
  booking_cancelled: CalendarX,
};

/** How many recent notifications the section lists (as on Aulas). */
const MAX = 15;

/** The payload's lesson day, mid-sentence: "amanhã", "sábado", "29 de outubro". */
function lessonDay(payload: Record<string, unknown>): string | null {
  const d = payload.bookingDate;
  if (typeof d !== "string") return null;
  try {
    return formatRelativeDay(d, { lowercase: true });
  } catch {
    return null;
  }
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

/**
 * Notificações on Reservas (deck 10): grouped Hoje · Ontem · Esta semana ·
 * Anteriores, actor in semibold, unread dot, "Marcar tudo como lido".
 * The section takes focus (tabIndex -1) when that button disappears.
 *
 * Each notification about a booking opens the tab that booking is in now
 * (`tabs`: booking id → tab), not the one its type suggests: an answered
 * request is no longer under Pendentes.
 */
export async function SchoolNotifications({
  notifications,
  unread,
  tabs,
  tabHref,
  className,
}: {
  notifications: NotificationItem[];
  unread: number;
  /** Booking id → the Reservas tab it is in today. */
  tabs: Record<string, BookingTab>;
  tabHref: Record<BookingTab, string>;
  className?: string;
}) {
  const t = await getTranslations("SchoolBookingsPage.notifications");
  const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

  function message(n: NotificationItem): React.ReactNode {
    const p = n.payload ?? {};
    const day = lessonDay(p);
    if (!day) return t("types.other");
    switch (n.type) {
      case "booking_requested":
        return t.rich("types.booking_requested", {
          school: str(p.schoolName),
          instructor: str(p.instructorName),
          day,
          strong,
        });
      case "booking_accepted":
        return t.rich("types.booking_accepted", { instructor: str(p.instructorName), day, strong });
      case "booking_declined":
        return t.rich("types.booking_declined", { instructor: str(p.instructorName), day, strong });
      case "booking_cancelled":
        return str(p.byUserName)
          ? t.rich("types.booking_cancelled", { name: str(p.byUserName), day, strong })
          : t("types.booking_cancelled_anonymous", { day });
      default:
        return t("types.other");
    }
  }

  function href(n: NotificationItem): string | undefined {
    const id = n.payload?.bookingId;
    const tab = typeof id === "string" ? tabs[id] : undefined;
    return tab ? tabHref[tab] : undefined;
  }

  const items = notifications.slice(0, MAX);
  return (
    <section
      id="notificacoes-secao"
      tabIndex={-1}
      aria-labelledby="notificacoes"
      className={cn("flex flex-col gap-3 outline-none", className)}
    >
      <SectionHeading
        id="notificacoes"
        title={t("title")}
        description={items.length > 0 ? t("unread", { count: unread }) : undefined}
        action={unread > 0 ? <MarkAllReadButton focusAfter="notificacoes-secao" /> : undefined}
      />
      {items.length === 0 ? (
        <p className="rounded-card border bg-card p-card text-body text-muted-foreground shadow-card">
          {t("empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {groupNotifications(items, (n) => n.createdAt).map(({ group, items }) => (
            <NotificationGroup key={group} group={group}>
              {items.map((n) => (
                <NotificationRow
                  key={n.id}
                  icon={ICONS[n.type] ?? Bell}
                  href={href(n)}
                  at={n.createdAt}
                  unread={!n.readAt}
                >
                  {message(n)}
                </NotificationRow>
              ))}
            </NotificationGroup>
          ))}
        </div>
      )}
    </section>
  );
}
