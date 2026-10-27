import type { BookingView } from "@/lib/services/booking";
import type { IsoDate } from "@/lib/format";

/**
 * Pure helpers that split an instructor's bookings into the three views of
 * Aulas (Pedidos · Próximas · Histórico) and compute the Início stats.
 * No I/O; safe on server and client. `today` is Lisbon today
 * (`lisbonToday()`), passed in so callers and tests agree on "now".
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

/**
 * Display state of a row: the DB status, plus "expired" for a request
 * nobody answered whose day has passed (still `requested` in the DB).
 */
export type BookingDisplayStatus = InstructorBooking["status"] | "expired";

export type InstructorBookingGroups = {
  /** Requests to answer, soonest first. */
  requests: InstructorBooking[];
  /** Accepted lessons from today on, soonest first. */
  upcoming: InstructorBooking[];
  /** Everything else (past, declined, cancelled, completed), latest first. */
  history: InstructorBooking[];
};

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

const chronological = (a: InstructorBooking, b: InstructorBooking) =>
  a.bookingDate.localeCompare(b.bookingDate) || a.startTime.localeCompare(b.startTime);

export function groupInstructorBookings(
  bookings: readonly InstructorBooking[],
  today: IsoDate,
): InstructorBookingGroups {
  const requests: InstructorBooking[] = [];
  const upcoming: InstructorBooking[] = [];
  const history: InstructorBooking[] = [];
  for (const b of bookings) {
    const ahead = b.bookingDate >= today;
    if (b.status === "requested" && ahead) requests.push(b);
    else if (b.status === "accepted" && ahead) upcoming.push(b);
    else history.push(b);
  }
  requests.sort(chronological);
  upcoming.sort(chronological);
  history.sort((a, b) => chronological(b, a));
  return { requests, upcoming, history };
}

export function displayStatus(b: InstructorBooking, today: IsoDate): BookingDisplayStatus {
  return b.status === "requested" && b.bookingDate < today ? "expired" : b.status;
}

function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * This calendar month (Lisbon): lessons taken (accepted or completed,
 * past or still ahead) and their total hours.
 */
export function monthStats(
  bookings: readonly InstructorBooking[],
  today: IsoDate,
): { lessons: number; hours: number } {
  const month = today.slice(0, 7);
  let lessons = 0;
  let minutes = 0;
  for (const b of bookings) {
    if (b.status !== "accepted" && b.status !== "completed") continue;
    if (b.bookingDate.slice(0, 7) !== month) continue;
    lessons += 1;
    minutes += Math.max(0, minutesOf(b.endTime) - minutesOf(b.startTime));
  }
  return { lessons, hours: minutes / 60 };
}
