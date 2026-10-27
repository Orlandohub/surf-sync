import { useTranslations } from "next-intl";
import { CalendarPlus, CalendarX2 } from "lucide-react";
import type { IconComponent } from "@/components/brand/icons";
import type { NotificationItem } from "@/lib/services/notifications";
import type { BookingList } from "@/lib/booking-view";
import {
  NotificationsSection,
  payloadDay,
  payloadText,
  payloadTime,
} from "@/components/shell/notifications-section";

/**
 * What an instructor is notified about (lib/services/booking.ts): a school
 * asked for a lesson, or cancelled one. Anything else gets the generic
 * sentence.
 */
const ICONS = {
  booking_requested: CalendarPlus,
  booking_cancelled: CalendarX2,
} satisfies Record<string, IconComponent>;

type BookingType = keyof typeof ICONS;

const isBookingType = (type: string): type is BookingType => type in ICONS;

/**
 * Notificações on Aulas: the shared NotificationsSection with the
 * instructor's sentences. Each notification links to the Aulas tab where
 * its booking is *now* (`placeOf`, from the page's own bookings): a
 * request that was accepted since opens Próximas, not an empty Pedidos.
 * A booking the page doesn't know links to Aulas without a tab.
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
      view={(n) => {
        const school = payloadText(n.payload.schoolName);
        const day = payloadDay(n.payload.bookingDate);
        const time = payloadTime(n.payload.startTime);
        const type = isBookingType(n.type) && day && school ? n.type : null;
        if (!type) return { message: t("types.other") };
        const place = placeOf.get(payloadText(n.payload.bookingId));
        return {
          icon: ICONS[type],
          href: place ? `/instructor/bookings?tab=${place}` : "/instructor/bookings",
          message: t.rich(`types.${type}${time ? "_at" : ""}`, {
            school,
            day: day ?? "",
            time: time ?? "",
            strong: (chunks) => <strong>{chunks}</strong>,
          }),
        };
      }}
    />
  );
}
