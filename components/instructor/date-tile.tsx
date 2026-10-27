import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { IsoDate } from "@/lib/format";

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

/**
 * Leading tile for a booking row: the month over the day of the month
 * ("out" / 31, PT lowercase as in "31 out."), like a calendar leaf. It
 * complements the relative meta line ("Sábado · 10:00–12:00") instead of
 * repeating its weekday. Decorative for screen readers: the meta line
 * carries the day.
 * `muted` for history rows.
 */
export function DateTile({ date, muted = false }: { date: IsoDate; muted?: boolean }) {
  const t = useTranslations("InstructorBookingRow.months");
  const month = MONTHS[Number(date.slice(5, 7)) - 1];
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
      <span className="text-caption leading-none">{t(month)}</span>
      <span className="text-title-sm leading-none tabular-nums">{day}</span>
    </span>
  );
}
