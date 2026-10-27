import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { DAY_KEYS, weekdayName, type DayKey } from "@/lib/format";

const EN_DASH = "–";

/**
 * The instructor's week as 7 rows in one card: "Segunda   09:00–13:00",
 * days off read "Indisponível". Zero-padded 24 h times so the ranges line
 * up (DESIGN.md §3, slot grids).
 */
export function WeeklyAvailability({
  slots,
}: {
  slots: readonly { day: DayKey; start: string; end: string }[];
}) {
  const t = useTranslations("DiscoveryPage.profile");
  return (
    <ul role="list" className="overflow-hidden rounded-card border bg-card shadow-card">
      {DAY_KEYS.map((day) => {
        const slot = slots.find((s) => s.day === day);
        return (
          <li
            key={day}
            className={cn(
              "relative flex h-12 items-center justify-between gap-4 px-card text-body",
              "not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:left-card not-first:before:h-px not-first:before:bg-border",
            )}
          >
            <span className={cn("flex items-center gap-2.5", slot ? "text-foreground" : "text-muted-foreground")}>
              <span
                aria-hidden
                className={cn("size-1.5 shrink-0 rounded-full", slot ? "bg-primary" : "bg-border")}
              />
              {weekdayName(day)}
            </span>
            {slot ? (
              <span className="font-medium text-foreground tabular-nums">
                {slot.start}
                {EN_DASH}
                {slot.end}
              </span>
            ) : (
              <span className="text-muted-foreground">{t("unavailable")}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
