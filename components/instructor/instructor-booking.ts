import type { BookingView } from "@/lib/services/booking";

/**
 * The instructor's slice of a booking: what a row needs, serializable (no
 * Dates). How bookings are split into Pedidos · Próximas · Histórico, the
 * "Sem resposta" display status and the month's stats are shared with the
 * school screens: lib/booking-view.
 */

/** What a booking row needs — serializable, no Dates. */
export type InstructorBooking = Pick<
  BookingView,
  | "id"
  | "schoolName"
  | "requestedByName"
  | "bookingDate"
  | "startTime"
  | "endTime"
  | "status"
  | "notes"
  | "declineReason"
>;

export function toInstructorBooking(b: BookingView): InstructorBooking {
  return {
    id: b.id,
    schoolName: b.schoolName,
    requestedByName: b.requestedByName,
    bookingDate: b.bookingDate,
    startTime: b.startTime,
    endTime: b.endTime,
    status: b.status,
    notes: b.notes,
    declineReason: b.declineReason,
  };
}
