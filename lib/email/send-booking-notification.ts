import { sendEmail } from "@/lib/email/transport";
import { renderBookingNotificationEmail } from "@/lib/email/templates/booking-notification";
import type { BookingEventType, NotificationPayload } from "@/lib/services/notifications";

/**
 * Booking-event email (Epic 8). One template, four event variants.
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
  const subjects: Record<BookingEventType, string> = {
    booking_requested: `Novo pedido de reserva — ${payload.bookingDate}`,
    booking_accepted: `Reserva confirmada — ${payload.bookingDate}`,
    booking_declined: `Resposta ao pedido — ${payload.bookingDate}`,
    booking_cancelled: `Reserva cancelada — ${payload.bookingDate}`,
  };
  await sendEmail({ to, subject: subjects[type], html, text });
}
