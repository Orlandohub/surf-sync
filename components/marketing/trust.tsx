import { getTranslations } from "next-intl/server";
import { BellRing, CircleCheck, UserRoundCheck } from "lucide-react";
import { CalendarWave, type IconComponent } from "@/components/brand/icons";
import { cn } from "@/lib/utils";
import {
  DisplayHeading,
  FeatureItem,
  MarkBackdrop,
  Panel,
  PanelFrame,
  marketingColumn,
  marketingSection,
} from "@/components/marketing/primitives";

// Each line is a rule the services enforce today:
// active-only search (discovery), slot inside weekly availability and no
// overlap (booking), requested → accepted only by the instructor, either
// side may cancel (booking), every event notifies the other side
// (notifications: in-app row + email).
const RULES = [
  ["active", UserRoundCheck],
  ["availability", CalendarWave],
  ["decision", CircleCheck],
  ["notify", BellRing],
] as const satisfies readonly (readonly [string, IconComponent])[];

/** "regras claras": the marketplace rules, on an Azul Atlântico panel. */
export async function Trust() {
  const t = await getTranslations("HomePage.trust");

  return (
    <PanelFrame aria-labelledby="regras">
      <Panel tone="ink">
        <MarkBackdrop className="-top-24 -right-40 size-120 text-inverse-foreground/5 md:-top-40 md:-right-56 md:size-200" />
        <div className={cn(marketingColumn, marketingSection)}>
          <DisplayHeading id="regras" tone="ink" className="max-w-2xl">
            {t("title")}
          </DisplayHeading>
          <p className="mt-4 max-w-prose text-body-lg text-inverse-foreground/80">{t("intro")}</p>
          <ul className="mt-12 grid gap-x-12 gap-y-8 md:mt-16 md:grid-cols-2">
            {RULES.map(([key, Icon]) => (
              <FeatureItem
                key={key}
                tone="ink"
                icon={
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-inverse-foreground/10 text-brand-water">
                    <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                  </span>
                }
                title={t(`items.${key}.title`)}
                description={t(`items.${key}.description`)}
              />
            ))}
          </ul>
        </div>
      </Panel>
    </PanelFrame>
  );
}
