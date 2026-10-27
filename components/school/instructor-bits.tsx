import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DAY_KEYS, weekdayLong, weekdayShort } from "@/lib/format";
import type { InstructorCard } from "@/lib/services/discovery";

/**
 * Small pieces shared by the instructor list and the instructor profile.
 * Server-component friendly (no client JS).
 */

export function LevelBadge({ level }: { level: InstructorCard["experienceLevel"] }) {
  const t = useTranslations("DiscoveryPage.levels");
  return <Badge>{t(level)}</Badge>;
}

const LIST = new Intl.ListFormat("pt-PT", { type: "conjunction" });

/**
 * SEG … DOM with the instructor's available weekdays filled (tint) and the
 * rest left open. The strip itself is hidden from screen readers; a
 * sentence ("Disponível: segunda-feira, terça-feira e sábado.") says the
 * same thing.
 *
 * A size container: the seven-day grid needs 16rem. Narrower (large text
 * on a phone) it shows only the available days, as chips that wrap, so
 * no label is ever squeezed out of its chip.
 */
export function WeekStrip({
  days,
  className,
}: {
  days: readonly string[];
  className?: string;
}) {
  const t = useTranslations("DiscoveryPage.row");
  const on = new Set(days);
  const available = DAY_KEYS.filter((d) => on.has(d));
  const names = available.map(weekdayLong);
  const chip =
    // design-lint-disable-next-line SS09 -- weekday labels (COMPONENTS.md "Day chips")
    "flex h-7 items-center justify-center rounded-chip text-caption uppercase tabular-nums";
  return (
    <div data-slot="week-strip" className={cn("@container", className)}>
      <span className="sr-only">
        {names.length ? t("availableOn", { days: LIST.format(names) }) : t("noAvailability")}
      </span>
      <div aria-hidden className="hidden grid-cols-7 gap-1 @3xs:grid">
        {DAY_KEYS.map((d) => (
          <span
            key={d}
            className={cn(chip, on.has(d) ? "bg-tint font-semibold text-tint-foreground" : "text-muted-foreground")}
          >
            {weekdayShort(d)}
          </span>
        ))}
      </div>
      <div aria-hidden className="flex flex-wrap gap-1 @3xs:hidden">
        {available.length > 0 ? (
          available.map((d) => (
            <span key={d} className={cn(chip, "bg-tint px-2 font-semibold text-tint-foreground")}>
              {weekdayShort(d)}
            </span>
          ))
        ) : (
          <span className="text-meta text-muted-foreground">{t("noAvailability")}</span>
        )}
      </div>
    </div>
  );
}
