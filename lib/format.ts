/**
 * PT-PT formatting for dates, times and timestamps (DESIGN.md §3).
 *
 *   formatRelativeDay("2026-10-28")              → "Amanhã"
 *   formatDate("2026-05-25")                     → "25 de maio"
 *   formatTime("09:00:00")                       → "9:00"      (running text)
 *   formatSlot("09:00:00")                       → "09:00"     (slot grids)
 *   formatTimeRange("09:00:00", "11:00:00")      → "9:00–11:00"
 *   formatDayTime("2026-10-28", "09:00:00")      → "Amanhã · 9:00"
 *   formatNotificationTime(createdAt)            → "há 5 min" · "Hoje · 14:30" · "Ontem · 9:10" · "25 out."
 *
 * Two kinds of input, never mixed:
 * - **Calendar dates** (`"2026-10-28"`, Postgres `date`) and **wall-clock
 *   times** (`"09:00:00"`, Postgres `time`) are Lisbon-local by definition.
 *   They are formatted as written — never turned into a `Date`, so they
 *   can't shift a day on a UTC server (Vercel) or in a browser elsewhere.
 * - **Instants** (`Date` or ISO timestamp, e.g. `createdAt`) are shown in
 *   Europe/Lisbon time.
 *
 * "Today" is always the Lisbon calendar date. Every function that depends on
 * it takes an optional `now` (an instant) so callers and tests can pin it.
 *
 * Month and weekday names come from date-fns' `pt` locale. The handful of
 * relative words ("Hoje", "Amanhã", "Ontem", "Agora", "há … min") are locale
 * data for these formatters; the app ships PT-PT only — if a second locale
 * ever ships, move them into next-intl.
 *
 * Pure functions, no Next/React imports: safe in Server and Client
 * Components, services and tests.
 */
import type { Day, Month } from "date-fns";
import { pt } from "date-fns/locale";

export const TIME_ZONE = "Europe/Lisbon";

/** Weekday keys, Monday first — the same keys the DB uses (`day_of_week`). */
export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

/** A calendar date as `YYYY-MM-DD`. */
export type IsoDate = string;
/** An instant: a Date or anything `new Date()` parses (ISO timestamp). */
export type Instant = Date | string | number;

const WORDS = {
  today: "Hoje",
  tomorrow: "Amanhã",
  yesterday: "Ontem",
  now: "Agora",
  minutesAgo: (n: number) => `há ${n} min`,
} as const;

const SEP = " · ";
const EN_DASH = "–";
const DAY_MS = 86_400_000;

// date-fns locale day index: 0 = Sunday … 6 = Saturday.
const LOCALE_DAY_INDEX: Record<DayKey, Day> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 0,
};

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

type CalendarDate = { year: number; month: number; day: number };

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;
const WALL_TIME = /^(\d{1,2}):(\d{2})/;

function parseIsoDate(value: IsoDate): CalendarDate {
  const m = ISO_DATE.exec(value);
  if (!m) throw new RangeError(`Expected a YYYY-MM-DD date, got "${value}"`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function parseWallTime(value: string): { hour: number; minute: number } {
  const m = WALL_TIME.exec(value);
  if (!m) throw new RangeError(`Expected an HH:MM time, got "${value}"`);
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

function toInstant(value: Instant): Date {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) throw new RangeError(`Invalid instant "${String(value)}"`);
  return d;
}

/** Days since the epoch for a calendar date — pure arithmetic, no time zone. */
function epochDay({ year, month, day }: CalendarDate): number {
  return Math.round(Date.UTC(year, month - 1, day) / DAY_MS);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toIso({ year, month, day }: CalendarDate): IsoDate {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toLocaleUpperCase("pt-PT") + s.slice(1);
}

// ---------------------------------------------------------------------------
// Lisbon clock
// ---------------------------------------------------------------------------

const lisbonFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

type LisbonParts = CalendarDate & { hour: number; minute: number };

function lisbonParts(instant: Instant): LisbonParts {
  const parts = lisbonFormatter.formatToParts(toInstant(instant));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    // Some engines report midnight as 24 even with h23.
    hour: get("hour") % 24,
    minute: get("minute"),
  };
}

/** Today's calendar date in Lisbon, e.g. `"2026-10-27"` — even on a UTC server. */
export function lisbonToday(now: Instant = new Date()): IsoDate {
  return toIso(lisbonParts(now));
}

/**
 * Whole calendar days from Lisbon today to `date`: 0 today, 1 tomorrow,
 * −1 yesterday. DST-proof (calendar arithmetic, not milliseconds).
 */
export function daysFromToday(date: IsoDate, now: Instant = new Date()): number {
  return epochDay(parseIsoDate(date)) - epochDay(lisbonParts(now));
}

/** Weekday key of a calendar date ("2026-10-28" → "wed"). */
export function dayKeyOf(date: IsoDate): DayKey {
  // 1970-01-01 was a Thursday.
  const dow = (((epochDay(parseIsoDate(date)) + 4) % 7) + 7) % 7; // 0 = Sunday
  return DAY_KEYS[(dow + 6) % 7];
}

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------

/** "seg", "ter" … — render uppercase via CSS in calendars and day chips. */
export function weekdayShort(day: DayKey): string {
  return pt.localize.day(LOCALE_DAY_INDEX[day], { width: "short" });
}

/** "segunda-feira" … — for aria-labels where the short form is ambiguous. */
export function weekdayLong(day: DayKey): string {
  return pt.localize.day(LOCALE_DAY_INDEX[day], { width: "wide" });
}

/** "Segunda", "Terça" … "Sábado", "Domingo" — label form, sentence case. */
export function weekdayName(day: DayKey): string {
  return capitalize(weekdayLong(day).replace(/-feira$/, ""));
}

function monthName(month: number): string {
  return pt.localize.month((month - 1) as Month, { width: "wide" });
}

function monthShort(month: number): string {
  const abbr = pt.localize.month((month - 1) as Month, { width: "abbreviated" });
  return abbr.endsWith(".") ? abbr : `${abbr}.`;
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

type NowOption = { now?: Instant };

/**
 * "25 de maio"; the year only when it isn't the current (Lisbon) year:
 * "3 de janeiro de 2027". Months are lowercase (AO90).
 */
export function formatDate(date: IsoDate, { now = new Date() }: NowOption = {}): string {
  const d = parseIsoDate(date);
  const base = `${d.day} de ${monthName(d.month)}`;
  return d.year === lisbonParts(now).year ? base : `${base} de ${d.year}`;
}

/**
 * Relative day label: "Hoje", "Amanhã", "Ontem", the weekday within the
 * next 6 days ("Sábado"), otherwise the date ("25 de maio").
 * `lowercase` for mid-sentence use ("a aula de sábado").
 */
export function formatRelativeDay(
  date: IsoDate,
  { now = new Date(), lowercase = false }: NowOption & { lowercase?: boolean } = {},
): string {
  const diff = daysFromToday(date, now);
  let label: string;
  if (diff === 0) label = WORDS.today;
  else if (diff === 1) label = WORDS.tomorrow;
  else if (diff === -1) label = WORDS.yesterday;
  else if (diff >= 2 && diff <= 6) label = weekdayName(dayKeyOf(date));
  else label = formatDate(date, { now });
  return lowercase ? label.charAt(0).toLocaleLowerCase("pt-PT") + label.slice(1) : label;
}

// ---------------------------------------------------------------------------
// Times
// ---------------------------------------------------------------------------

/** Running-text time: "09:00:00" → "9:00", "14:30" → "14:30". */
export function formatTime(time: string): string {
  const { hour, minute } = parseWallTime(time);
  return `${hour}:${pad2(minute)}`;
}

/** Slot-grid time, zero-padded for column alignment: "9:00:00" → "09:00". */
export function formatSlot(time: string): string {
  const { hour, minute } = parseWallTime(time);
  return `${pad2(hour)}:${pad2(minute)}`;
}

/** "9:00–11:00" (en dash, no spaces). */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)}${EN_DASH}${formatTime(end)}`;
}

/** "Amanhã · 9:00" — one separator per line. */
export function formatDayTime(date: IsoDate, time: string, opts: NowOption = {}): string {
  return `${formatRelativeDay(date, opts)}${SEP}${formatTime(time)}`;
}

/** "Amanhã · 9:00–11:00" — the booking line. */
export function formatDayTimeRange(
  date: IsoDate,
  start: string,
  end: string,
  opts: NowOption = {},
): string {
  return `${formatRelativeDay(date, opts)}${SEP}${formatTimeRange(start, end)}`;
}

/**
 * When something happened, for notification and activity rows:
 * "Agora" (< 1 min) · "há 5 min" (< 1 h) · "Hoje · 14:30" · "Ontem · 9:10"
 * · "25 out." · "25 out. 2025" (other year). Shown in Lisbon time.
 */
export function formatNotificationTime(at: Instant, { now = new Date() }: NowOption = {}): string {
  const instant = toInstant(at);
  const current = toInstant(now);
  const elapsedMs = current.getTime() - instant.getTime();

  if (elapsedMs < 60_000 && elapsedMs > -60_000) return WORDS.now;
  if (elapsedMs > 0 && elapsedMs < 3_600_000) {
    return WORDS.minutesAgo(Math.floor(elapsedMs / 60_000));
  }

  const p = lisbonParts(instant);
  const today = lisbonParts(current);
  const time = `${p.hour}:${pad2(p.minute)}`;
  const diff = epochDay(p) - epochDay(today);
  if (diff === 0) return `${WORDS.today}${SEP}${time}`;
  if (diff === -1) return `${WORDS.yesterday}${SEP}${time}`;

  const short = `${p.day} ${monthShort(p.month)}`;
  return p.year === today.year ? short : `${short} ${p.year}`;
}

// ---------------------------------------------------------------------------
// Time options
// ---------------------------------------------------------------------------

/**
 * Zero-padded "HH:MM" options from `min` to `max` inclusive, every `step`
 * minutes — the time-select grid. Defaults: 06:00–22:00, 30 min.
 */
export function timeOptions({
  min = "06:00",
  max = "22:00",
  step = 30,
}: { min?: string; max?: string; step?: number } = {}): string[] {
  if (!Number.isInteger(step) || step <= 0) throw new RangeError("step must be a positive integer");
  const toMinutes = (t: string) => {
    const { hour, minute } = parseWallTime(t);
    return hour * 60 + minute;
  };
  const out: string[] = [];
  for (let m = toMinutes(min), end = toMinutes(max); m <= end && m < 24 * 60; m += step) {
    out.push(`${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`);
  }
  return out;
}
