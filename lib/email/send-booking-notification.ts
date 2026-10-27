import { sendEmail } from "@/lib/email/transport";
import { renderBookingNotificationEmail } from "@/lib/email/templates/booking-notification";
import type { BookingEventType, NotificationPayload } from "@/lib/services/notifications";
import { formatDate } from "@/lib/format";

/**
 * Booking-event email (Epic 8). One template, four event variants.
 * Dates are absolute ("28 de outubro"): an email is read later, so
 * "Amanhã" would go stale.
 */
export async function sendBookingNotificationEmail({
  to,
  type,
  payload,
}: {
  to: string;
  type: BookingEventType;
  payload: NotificationPayload;
}): Promise<void> {
  const { html, text } = await renderBookingNotificationEmail(type, payload);
  const date = formatDate(payload.bookingDate);
  const subjects: Record<BookingEventType, string> = {
    booking_requested: `Novo pedido de aula — ${date}`,
    booking_accepted: `Aula confirmada — ${date}`,
    booking_declined: `Pedido recusado — ${date}`,
    booking_cancelled: `Aula cancelada — ${date}`,
  };
  await sendEmail({ to, subject: subjects[type], html, text });
}
