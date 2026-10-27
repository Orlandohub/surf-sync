import { getTranslations } from "next-intl/server";
import { CirclePause, Inbox, MapPin, Search, Send, UsersRound } from "lucide-react";
import { CalendarWave, type IconComponent } from "@/components/brand/icons";
import { RowIcon } from "@/components/ui/list-row";
import { cn } from "@/lib/utils";
import {
  DisplayHeading,
  FeatureItem,
  marketingColumn,
  marketingSection,
} from "@/components/marketing/primitives";

// What each side can do today — every line maps to a shipped feature
// (lib/services/discovery, booking, school, instructor).
const SCHOOL_ITEMS = [
  ["search", Search],
  ["availability", CalendarWave],
  ["request", Send],
  ["team", UsersRound],
] as const satisfies readonly (readonly [string, IconComponent])[];

const INSTRUCTOR_ITEMS = [
  ["zones", MapPin],
  ["availability", CalendarWave],
  ["respond", Inbox],
  ["pause", CirclePause],
] as const satisfies readonly (readonly [string, IconComponent])[];

/** "para escolas" and "para instrutores", side by side from lg. */
export async function Audiences() {
  const t = await getTranslations("HomePage.audiences");

  const cards = [
    { key: "schools", items: SCHOOL_ITEMS },
    { key: "instructors", items: INSTRUCTOR_ITEMS },
  ] as const;

  return (
    <div className={cn(marketingColumn, marketingSection)}>
      <div className="grid gap-stack md:gap-6 lg:grid-cols-2">
        {cards.map(({ key, items }) => (
          <section
            key={key}
            aria-labelledby={`audience-${key}`}
            className="flex flex-col rounded-sheet border bg-card p-6 shadow-card sm:p-8 lg:p-10"
          >
            <DisplayHeading id={`audience-${key}`} className="lg:text-display-sm">{t(`${key}.title`)}</DisplayHeading>
            <p className="mt-4 max-w-prose text-body-lg text-muted-foreground">{t(`${key}.intro`)}</p>
            <ul className="mt-8 grid gap-6 border-t pt-8 md:grid-cols-2 md:gap-x-8 lg:grid-cols-1">
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
