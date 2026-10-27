import { getTranslations } from "next-intl/server";
import { CalendarCheck, CirclePause, MapPin, Star, UserPlus, UsersRound } from "lucide-react";
import { CalendarWave, type IconComponent } from "@/components/brand/icons";
import { RowIcon } from "@/components/ui/list-row";
import { cn } from "@/lib/utils";
import {
  DisplayHeading,
  FeatureItem,
  marketingColumn,
  marketingSection,
} from "@/components/marketing/primitives";

// What each side gets today — every line maps to a shipped feature
// (lib/services/discovery, booking, school, instructor). Icons match the
// app's own tabs (Instrutores, Reservas/Aulas, Disponibilidade). The
// search filters live in "como funciona" and the booking rules in
// "regras claras", so they aren't repeated here.
const SCHOOL_ITEMS = [
  ["profiles", UsersRound],
  ["bookings", CalendarCheck],
  ["saved", Star],
  ["team", UserPlus],
] as const satisfies readonly (readonly [string, IconComponent])[];

const INSTRUCTOR_ITEMS = [
  ["zones", MapPin],
  ["availability", CalendarWave],
  ["lessons", CalendarCheck],
  ["pause", CirclePause],
] as const satisfies readonly (readonly [string, IconComponent])[];

/**
 * "para escolas" and "para instrutores", side by side from lg. The card
 * titles are 32 px at every width (a heading inside a card), so the
 * section scale never jumps between tablet and desktop.
 */
export async function Audiences() {
  const t = await getTranslations("HomePage.audiences");

  const cards = [
    { key: "schools", items: SCHOOL_ITEMS },
    { key: "instructors", items: INSTRUCTOR_ITEMS },
  ] as const;

  return (
    <div className={cn(marketingColumn, marketingSection)}>
      <div className="grid grid-cols-1 gap-stack md:gap-6 lg:grid-cols-2">
        {cards.map(({ key, items }) => (
          <section
            key={key}
            aria-labelledby={`audience-${key}`}
            className="flex min-w-0 flex-col rounded-sheet border bg-card p-6 shadow-card sm:p-8 lg:p-10"
          >
            <DisplayHeading id={`audience-${key}`} className="md:text-display-sm">
              {t(`${key}.title`)}
            </DisplayHeading>
            <p className="mt-4 max-w-prose text-body-lg text-muted-foreground">{t(`${key}.intro`)}</p>
            <ul className="mt-8 grid grid-cols-1 gap-6 border-t pt-8 md:grid-cols-2 md:gap-x-8 lg:grid-cols-1">
              {items.map(([item, Icon]) => (
                <FeatureItem
                  key={item}
                  icon={<RowIcon icon={Icon} className="shrink-0" />}
                  title={t(`${key}.items.${item}.title`)}
                  description={t(`${key}.items.${item}.description`)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
