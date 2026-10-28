import { getTranslations } from "next-intl/server";
import { BellRing, CalendarX2, CircleCheck } from "lucide-react";
import type { IconComponent } from "@/components/brand/icons";
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

// Only guarantees the services enforce today (lib/services/booking,
// notifications): a request must sit inside the instructor's weekly slot
// and can't overlap another requested/accepted lesson; requested →
// accepted only by the instructor, and either side may cancel a requested
// or accepted booking; every event reaches the other side in the app and
// by email.
const RULES = [
  ["overlap", CalendarX2],
  ["decision", CircleCheck],
  ["notify", BellRing],
] as const satisfies readonly (readonly [string, IconComponent])[];

/** "regras claras": the marketplace rules, on an Azul Atlântico panel. */
export async function Trust() {
  const t = await getTranslations("HomePage.trust");

  return (
    <PanelFrame aria-labelledby="regras">
      <Panel tone="ink">
        <MarkBackdrop className="-top-24 -right-40 size-120 text-brand-panel-foreground/5 md:-top-40 md:-right-56 md:size-200" />
        <div className={cn(marketingColumn, marketingSection)}>
          <DisplayHeading id="regras" tone="ink" className="max-w-2xl">
            {t("title")}
          </DisplayHeading>
          <p className="mt-4 max-w-prose text-body-lg text-brand-panel-foreground/80">{t("intro")}</p>
          <ul className="mt-12 grid grid-cols-1 gap-x-10 gap-y-8 md:mt-16 lg:grid-cols-3">
            {RULES.map(([key, Icon]) => (
              <FeatureItem
                key={key}
                tone="ink"
                icon={
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-panel-foreground/10 text-brand-water">
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
