import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DisplayHeading,
  MarkBackdrop,
  Panel,
  PanelFrame,
  marketingColumn,
} from "@/components/marketing/primitives";

/**
 * Closing band, after the deck's "a experiência" slide: a white panel,
 * the wave mark huge and barely there behind a centred display line, one
 * primary action, and a quiet way in for people who already have an
 * account.
 */
export async function ClosingCta() {
  const t = await getTranslations("HomePage");

  return (
    <PanelFrame aria-labelledby="comecar">
      <Panel tone="card">
        <MarkBackdrop className="top-1/2 left-1/2 size-120 -translate-x-1/2 -translate-y-1/2 text-background md:size-200" />
        <div className={cn(marketingColumn, "flex flex-col items-center py-20 text-center md:py-32")}>
          <DisplayHeading id="comecar" className="max-w-3xl lg:text-display-lg">
            {t("closing.title")}
          </DisplayHeading>
          <p className="mt-4 max-w-prose text-body-lg text-balance text-muted-foreground md:mt-6">
            {t("closing.description")}
          </p>
          <Link href="/sign-up" className={cn(buttonVariants({ size: "lg" }), "mt-10 sm:w-auto")}>
            {t("cta.signUp")}
            <ArrowRight aria-hidden strokeWidth={1.75} />
          </Link>
          <p className="mt-6 text-body text-muted-foreground">
            {t("closing.haveAccount")}{" "}
            <Link
              href="/sign-in"
              className="tap rounded-chip font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {t("cta.signIn")}
            </Link>
          </p>
        </div>
      </Panel>
    </PanelFrame>
  );
}
