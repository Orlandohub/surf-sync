import type { BookingView } from "@/lib/services/booking";
import { addDays, dayKeyOf, DAY_KEYS, lisbonToday, type IsoDate } from "@/lib/format";

/**
 * How the school screens slice a school's bookings (presentation only —
 * the state machine lives in lib/services/booking.ts):
 *
 *   pending   requested, today or later: waiting for the instructor
 *   upcoming  accepted, today or later: lessons on the calendar
 *   history   everything else: completed, declined, cancelled, and
 *             requests or lessons whose day has passed
 */
export type BookingTab = "pending" | "upcoming" | "history";

export function bookingTab(b: Pick<BookingView, "status" | "bookingDate">, today: IsoDate): BookingTab {
  if (b.bookingDate >= today && b.status === "requested") return "pending";
  if (b.bookingDate >= today && b.status === "accepted") return "upcoming";
  return "history";
}

/**
 * What a row's status badge says: the DB status, plus "expired" for a
 * request nobody answered whose day has passed (still `requested` in the
 * DB) — "Sem resposta", as the instructor sees it too.
 */
export type BookingDisplayStatus = BookingView["status"] | "expired";

export function displayStatus(
  b: Pick<BookingView, "status" | "bookingDate">,
  today: IsoDate,
): BookingDisplayStatus {
  return b.status === "requested" && b.bookingDate < today ? "expired" : b.status;
}

const byStart = (a: BookingView, b: BookingView) =>
  a.bookingDate.localeCompare(b.bookingDate) || a.startTime.localeCompare(b.startTime);

/** Pending and upcoming soonest first; history most recent first. */
export function groupBookings(
  bookings: readonly BookingView[],
  today: IsoDate = lisbonToday(),
): Record<BookingTab, BookingView[]> {
  const groups: Record<BookingTab, BookingView[]> = { pending: [], upcoming: [], history: [] };
  for (const b of bookings) groups[bookingTab(b, today)].push(b);
  groups.pending.sort(byStart);
  groups.upcoming.sort(byStart);
  groups.history.sort((a, b) => byStart(b, a));
  return groups;
}

/** Monday and Sunday of the calendar week that contains `today`. */
export function weekBounds(today: IsoDate): { start: IsoDate; end: IsoDate } {
  const start = addDays(today, -DAY_KEYS.indexOf(dayKeyOf(today)));
  return { start, end: addDays(start, 6) };
}

/** Lessons that happen (accepted) or happened (completed). */
const isLesson = (b: Pick<BookingView, "status">) => b.status === "accepted" || b.status === "completed";

/** The real numbers behind the Início stat tiles. */
export function bookingStats(bookings: readonly BookingView[], today: IsoDate = lisbonToday()) {
  const week = weekBounds(today);
  const month = today.slice(0, 7);
  return {
    pending: bookings.filter((b) => bookingTab(b, today) === "pending").length,
    thisWeek: bookings.filter(
      (b) => isLesson(b) && b.bookingDate >= week.start && b.bookingDate <= week.end,
    ).length,
    thisMonth: bookings.filter((b) => isLesson(b) && b.bookingDate.startsWith(month)).length,
  };
}
