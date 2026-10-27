import { cn } from "@/lib/utils";
import { dayKeyOf, weekdayShort, type IsoDate } from "@/lib/format";

/**
 * Leading tile for a booking row: the weekday over the day of the month
 * (QUA / 28), like a calendar leaf. It completes the relative meta line
 * ("Sábado · 10:00–12:00") with the date at a glance. Decorative for
 * screen readers — the meta line carries the day.
 * `muted` for history rows (nothing to act on).
 */
export function DateTile({ date, muted = false }: { date: IsoDate; muted?: boolean }) {
  const day = Number(date.slice(8, 10));
  return (
    <span
      aria-hidden
      data-slot="date-tile"
      className={cn(
        "flex size-12 flex-col items-center justify-center gap-0.5 rounded-thumb",
        muted ? "bg-muted text-muted-foreground" : "bg-tint text-tint-foreground",
      )}
    >
      {/* design-lint-disable-next-line SS09 -- calendar weekday label (DESIGN.md §3) */}
      <span className="text-caption leading-none uppercase">{weekdayShort(dayKeyOf(date))}</span>
      <span className="text-title-sm leading-none tabular-nums">{day}</span>
    </span>
  );
}
