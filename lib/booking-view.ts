import { addDays, dayKeyOf, DAY_KEYS, type IsoDate } from "@/lib/format";

/**
 * How the bookings screens of both sides slice a list of bookings —
 * presentation only (the state machine lives in lib/services/booking.ts).
 * Pure, no I/O; safe on server and client. `today` is Lisbon today
 * (`lisbonToday()`), passed in so callers and tests agree on "now".
 *
 *   requests  requested, today or later: waiting for the instructor
 *             (the instructor's "Pedidos", the school's "Pendentes")
 *   upcoming  accepted, today or later: lessons on the calendar
 *   history   everything else: completed, declined, cancelled, and
 *             requests or lessons whose day has passed
 *
 * Each side names the lists in its own words and URLs (the school's tab
 * for `requests` is "Pendentes", ?tab absent); map them at the URL, never
 * with a second grouping.
 *
 * Display status: the DB status, plus "expired" for a request nobody
 * answered whose day has passed (still `requested` in the DB). Show it as
 * "Sem resposta" on both sides, never as pending: StatusBadge's
 * bookingStatusTone/Icon know it (neutral, CalendarClock).
 */

export type BookingStatus = "requested" | "accepted" | "declined" | "cancelled" | "completed";
export type BookingDisplayStatus = BookingStatus | "expired";
export type BookingList = "requests" | "upcoming" | "history";

/** The fields these helpers read (BookingView, or an area's slimmer row). */
type Slotted = {
  status: BookingStatus;
  bookingDate: string;
  startTime: string;
  endTime: string;
};

export function bookingList(b: Pick<Slotted, "status" | "bookingDate">, today: IsoDate): BookingList {
  if (b.bookingDate >= today && b.status === "requested") return "requests";
  if (b.bookingDate >= today && b.status === "accepted") return "upcoming";
  return "history";
}

const chronological = (a: Slotted, b: Slotted) =>
  a.bookingDate.localeCompare(b.bookingDate) || a.startTime.localeCompare(b.startTime);

/** The three lists: requests and upcoming soonest first, history latest first. */
export function groupBookings<T extends Slotted>(
  bookings: readonly T[],
  today: IsoDate,
): Record<BookingList, T[]> {
  const groups: Record<BookingList, T[]> = { requests: [], upcoming: [], history: [] };
  for (const b of bookings) groups[bookingList(b, today)].push(b);
  groups.requests.sort(chronological);
  groups.upcoming.sort(chronological);
  groups.history.sort((a, b) => chronological(b, a));
  return groups;
}

export function displayStatus(
  b: Pick<Slotted, "status" | "bookingDate">,
  today: IsoDate,
): BookingDisplayStatus {
  return b.status === "requested" && b.bookingDate < today ? "expired" : b.status;
}

/** A lesson that happens (accepted) or happened (completed). */
export const isLesson = (b: Pick<Slotted, "status">) =>
  b.status === "accepted" || b.status === "completed";

/** Monday and Sunday of the calendar week that contains `today`. */
export function weekBounds(today: IsoDate): { start: IsoDate; end: IsoDate } {
  const start = addDays(today, -DAY_KEYS.indexOf(dayKeyOf(today)));
  return { start, end: addDays(start, 6) };
}

/** Lessons (accepted or completed) in this calendar week, Monday to Sunday. */
export function weekLessons(bookings: readonly Pick<Slotted, "status" | "bookingDate">[], today: IsoDate): number {
  const { start, end } = weekBounds(today);
  return bookings.filter((b) => isLesson(b) && b.bookingDate >= start && b.bookingDate <= end).length;
}

function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * This calendar month (Lisbon): lessons (accepted or completed, past or
 * still ahead) and their total hours — the "Aulas este mês" tiles.
 */
export function monthLessons(
  bookings: readonly Slotted[],
  today: IsoDate,
): { lessons: number; hours: number } {
  const month = today.slice(0, 7);
  let lessons = 0;
  let minutes = 0;
  for (const b of bookings) {
    if (!isLesson(b) || b.bookingDate.slice(0, 7) !== month) continue;
    lessons += 1;
    minutes += Math.max(0, minutesOf(b.endTime) - minutesOf(b.startTime));
  }
  return { lessons, hours: minutes / 60 };
}
