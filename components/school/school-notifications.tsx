import { useTranslations } from "next-intl";
import type { NotificationItem } from "@/lib/services/notifications";
import type { BookingList } from "@/lib/booking-view";
import {
  NotificationsSection,
  payloadDay,
  payloadText,
  payloadTime,
} from "@/components/shell/notifications-section";

/** What the staff member who asked is notified about (lib/services/booking.ts). */
const TYPES = ["booking_accepted", "booking_declined", "booking_cancelled"] as const;
type BookingType = (typeof TYPES)[number];
const isBookingType = (type: string): type is BookingType => (TYPES as readonly string[]).includes(type);

/**
 * Notificações on Reservas: the shared NotificationsSection with the
 * school's sentences — an instructor confirmed or declined a request, or a
 * lesson was cancelled ("Ana Marques confirmou a aula de amanhã · 9:00.").
 * Anything else gets the generic sentence. Each one links to the Reservas
 * tab where its booking is now (`placeOf`, `listHref`).
 */
export function SchoolNotifications({
  notifications,
  unread,
  placeOf,
  listHref,
  className,
}: {
  notifications: NotificationItem[];
  unread: number;
  /** Booking id → the Reservas list it is in today. */
  placeOf: ReadonlyMap<string, BookingList>;
  /** Each list's tab URL on Reservas. */
  listHref: Record<BookingList, string>;
  className?: string;
}) {
  const t = useTranslations("SchoolBookingsPage.notifications");

  return (
    <NotificationsSection
      notifications={notifications}
      unread={unread}
      empty={t("empty")}
      placeOf={placeOf}
      listHref={listHref}
      className={className}
      message={(n) => {
        const p = n.payload;
        const day = payloadDay(p.bookingDate);
        const time = payloadTime(p.startTime);
        if (!isBookingType(n.type) || !day) return t("types.other");
        const at = time ? "_at" : "";
        const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;
        const instructor = payloadText(p.instructorName);
        const by = payloadText(p.byUserName);
        switch (n.type) {
          case "booking_accepted":
          case "booking_declined":
            return instructor
              ? t.rich(`types.${n.type}${at}`, { instructor, day, time: time ?? "", strong })
              : t("types.other");
          case "booking_cancelled":
            return by
              ? t.rich(`types.booking_cancelled${at}`, { name: by, day, time: time ?? "", strong })
              : t(`types.booking_cancelled_anonymous${at}`, { day, time: time ?? "" });
        }
      }}
    />
  );
}
