import {
  TIME_ZONE,
  dayKeyOf,
  lisbonToday,
  upcomingDates,
  type DayKey,
  type Instant,
  type IsoDate,
} from "@/lib/format";

/**
 * What "Pedir aula" may offer, from an instructor's weekly availability
 * (pure; shared by the form and its tests). Times are "HH:MM".
 */
export type Slot = { day: DayKey; start: string; end: string };

/** Minutes between time options, and the shortest lesson. */
export const STEP = 30;

export const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export const fromMinutes = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const CLOCK = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Minutes since midnight on the Lisbon wall clock. */
export function lisbonMinutes(now: Instant): number {
  const parts = CLOCK.formatToParts(now instanceof Date ? now : new Date(now));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return (get("hour") % 24) * 60 + get("minute");
}

export function slotFor(slots: readonly Slot[], date: IsoDate): Slot | undefined {
  const day = dayKeyOf(date);
  return slots.find((s) => s.day === day);
}

/**
 * The first start (minutes) that can be offered on `date`: the slot's
 * start, or — today — the next half hour from now if that is later.
 */
export function earliestStart(date: IsoDate, slot: Slot, now: Instant): number {
  const start = toMinutes(slot.start);
  if (date !== lisbonToday(now)) return start;
  return Math.max(start, Math.ceil((lisbonMinutes(now) + 1) / STEP) * STEP);
}

/**
 * Upcoming dates on the instructor's weekdays (`weeks` weeks' worth),
 * minus today once no lesson of at least STEP minutes still fits.
 */
export function bookableDates(slots: readonly Slot[], now: Instant, weeks = 4): IsoDate[] {
  const days = slots.map((s) => s.day);
  return upcomingDates(days.length * weeks, { now, days }).filter((d) => {
    const s = slotFor(slots, d);
    return !!s && earliestStart(d, s, now) <= toMinutes(s.end) - STEP;
  });
}
