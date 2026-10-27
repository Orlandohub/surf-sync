import { BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DAY_KEYS, weekdayLong, weekdayShort } from "@/lib/format";
import type { InstructorCard } from "@/lib/services/discovery";

/**
 * Small pieces shared by the instructor list and the instructor profile.
 * Server-component friendly (no client JS).
 */

/** COMPONENTS.md "Avatar & stack": BadgeCheck after the name, not on the avatar. */
export function VerifiedMark({ className }: { className?: string }) {
  const t = useTranslations("DiscoveryPage.row");
  return (
    <>
      <BadgeCheck aria-hidden strokeWidth={1.75} className={cn("size-4 shrink-0 text-primary", className)} />
      <span className="sr-only">{t("verified")}</span>
    </>
  );
}

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
  const names = DAY_KEYS.filter((d) => on.has(d)).map(weekdayLong);
  return (
    <div data-slot="week-strip" className={cn("grid grid-cols-7 gap-1", className)}>
      <span className="sr-only">
        {names.length ? t("availableOn", { days: LIST.format(names) }) : t("noAvailability")}
      </span>
      {DAY_KEYS.map((d) => (
        <span
          key={d}
          aria-hidden
          className={cn(
            // design-lint-disable-next-line SS09 -- weekday labels (COMPONENTS.md "Day chips")
            "flex h-7 items-center justify-center rounded-chip text-caption uppercase tabular-nums",
            on.has(d)
              ? "bg-tint font-semibold text-tint-foreground"
              : "text-muted-foreground",
          )}
        >
          {weekdayShort(d)}
        </span>
      ))}
    </div>
  );
}
