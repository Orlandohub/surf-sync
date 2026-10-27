import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { LogoLockup } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import whitewater from "@/public/brand/whitewater-aerial.jpg";
import { MarkBackdrop, Panel, PanelFrame, marketingColumn } from "@/components/marketing/primitives";

/**
 * Landing hero: an Azul Atlântico panel with a short BD Sans display line,
 * what surfsync does in one plain sentence, and the two ways in. The
 * whitewater aerial (portrait, 1043×1304) sits in its own rounded frame —
 * a tall strip beside the text from lg, a 3:2 (phones) or 2:1 (tablets)
 * crop below it — never stretched full-bleed.
 *
 * The app bar shows only the mark below 640 px, so the hero carries the
 * full lockup there; from 640 px the bar's lockup is enough.
 */
export async function Hero() {
  const t = await getTranslations("HomePage");

  return (
    <PanelFrame aria-labelledby="hero-title" className="pt-2 sm:pt-4">
      <Panel tone="ink">
        <MarkBackdrop className="-bottom-40 -left-32 size-120 text-inverse-foreground/5 lg:-bottom-64 lg:-left-48 lg:size-200" />

        <div className={marketingColumn}>
          <div className="flex flex-col pt-8 pb-10 sm:pt-14 sm:pb-12 lg:w-7/12 lg:py-24 lg:pr-10 xl:w-2/3 xl:py-32">
            <LogoLockup height={32} className="mb-12 self-start text-inverse-foreground sm:hidden" />
            <h1
              id="hero-title"
              className="font-display text-display-sm text-balance lowercase sm:text-display xl:text-display-lg"
            >
              {t("hero.title")}
            </h1>
            <p className="mt-6 max-w-prose text-body-lg text-inverse-foreground/80 lg:mt-8">
              {t("hero.tagline")}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "focus-visible:ring-brand-water focus-visible:ring-offset-inverse sm:w-auto",
                )}
              >
                {t("cta.signUp")}
                <ArrowRight aria-hidden strokeWidth={1.75} />
              </Link>
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "border border-inverse-foreground/25 text-inverse-foreground hover:bg-inverse-foreground/10 focus-visible:ring-brand-water focus-visible:ring-offset-inverse sm:w-auto",
                )}
              >
                {t("cta.signIn")}
                <ArrowRight aria-hidden strokeWidth={1.75} />
              </Link>
            </div>
          </div>
        </div>

        {/* 8 px inset, radius 24 inside the panel's 32: concentric corners. */}
        <div className="px-2 pb-2 lg:absolute lg:inset-y-0 lg:right-0 lg:w-5/12 lg:py-2 lg:pl-0 xl:w-1/3">
          <div className="relative aspect-3/2 overflow-hidden rounded-sheet sm:aspect-2/1 lg:aspect-auto lg:h-full">
            <Image
              src={whitewater}
              alt={t("hero.photoAlt")}
              fill
              preload
              placeholder="blur"
              sizes="(min-width: 1280px) 427px, (min-width: 1024px) 42vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Panel>
    </PanelFrame>
  );
}
