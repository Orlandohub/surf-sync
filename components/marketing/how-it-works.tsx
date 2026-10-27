import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import { DisplayHeading, marketingColumn, marketingSection } from "@/components/marketing/primitives";

// The real onboarding and booking flow on each side: school account →
// create the school → search → request; instructor account → profile +
// zones + weekly availability (auto-activates) → accept/decline.
const TRACKS = [
  { key: "schools", steps: ["account", "search", "request"] },
  { key: "instructors", steps: ["account", "profile", "respond"] },
] as const;

/** "como funciona": three numbered steps for each side. */
export async function HowItWorks() {
  const t = await getTranslations("HomePage.steps");

  return (
    <section aria-labelledby="como-funciona" className={cn(marketingColumn, marketingSection, "pt-0 md:pt-0")}>
      <DisplayHeading id="como-funciona">{t("title")}</DisplayHeading>
      <p className="mt-4 max-w-prose text-body-lg text-muted-foreground">{t("intro")}</p>

      <div className="mt-12 flex flex-col gap-12 md:mt-16 md:gap-16">
        {TRACKS.map(({ key, steps }) => (
          <div key={key} className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
            <h3 id={`passos-${key}`} className="text-title-sm lg:border-t lg:pt-5">
              {t(`${key}.label`)}
            </h3>
            <ol aria-labelledby={`passos-${key}`} className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:col-span-3">
              {steps.map((step, index) => (
                <li key={step} className="flex min-w-0 gap-5 border-t pt-5 sm:flex-col sm:gap-4">
                  <span aria-hidden className="w-6 shrink-0 font-display text-display-sm text-primary tabular-nums">
                    {index + 1}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1 pt-1 sm:pt-0">
                    <h4 className="text-title-sm">{t(`${key}.${step}.title`)}</h4>
                    <p className="text-body text-muted-foreground">{t(`${key}.${step}.description`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
