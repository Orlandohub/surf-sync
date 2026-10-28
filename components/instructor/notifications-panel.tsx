import { useTranslations } from "next-intl";
import type { NotificationItem } from "@/lib/services/notifications";
import type { BookingList } from "@/lib/booking-view";
import {
  NotificationsSection,
  payloadDay,
  payloadText,
  payloadTime,
} from "@/components/shell/notifications-section";

/** Where each list lives on Aulas. */
const LIST_HREF: Record<BookingList, string> = {
  requests: "/instructor/bookings?tab=requests",
  upcoming: "/instructor/bookings?tab=upcoming",
  history: "/instructor/bookings?tab=history",
};

/** What an instructor is notified about (lib/services/booking.ts). */
const TYPES = ["booking_requested", "booking_cancelled"] as const;
type BookingType = (typeof TYPES)[number];
const isBookingType = (type: string): type is BookingType => (TYPES as readonly string[]).includes(type);

/**
 * Notificações on Aulas: the shared NotificationsSection with the
 * instructor's sentences — a school asked for a lesson, or cancelled one
 * ("Onda Norte pediu uma aula para sábado · 9:00."). Anything else gets
 * the generic sentence. Each one links to the Aulas tab where its booking
 * is now (`placeOf`).
 */
export function NotificationsPanel({
  notifications,
  unread,
  placeOf,
}: {
  notifications: NotificationItem[];
  unread: number;
  /** Booking id → the Aulas tab it is in today. */
  placeOf: ReadonlyMap<string, BookingList>;
}) {
  const t = useTranslations("InstructorBookingsPage.notifications");

  return (
    <NotificationsSection
      notifications={notifications}
      unread={unread}
      empty={t("empty")}
      placeOf={placeOf}
      listHref={LIST_HREF}
      message={(n) => {
        const school = payloadText(n.payload.schoolName);
        const day = payloadDay(n.payload.bookingDate);
        const time = payloadTime(n.payload.startTime);
        if (!isBookingType(n.type) || !day || !school) return t("types.other");
        return t.rich(`types.${n.type}${time ? "_at" : ""}`, {
          school,
          day,
          time: time ?? "",
          strong: (chunks) => <strong>{chunks}</strong>,
        });
      }}
    />
  );
}
