import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { LogoLockup } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import whitewater from "@/public/brand/whitewater-aerial.jpg";
import { MarkBackdrop, Panel, PanelFrame, displayWrap, marketingColumn } from "@/components/marketing/primitives";

/**
 * Landing hero: an Azul Atlântico panel with a short BD Sans display line,
 * what surfsync does in two plain sentences, and the two ways in. The
 * whitewater aerial (portrait, 1043×1304) sits in its own rounded frame:
 * a tall portrait strip beside the text from md (tablets included, so the
 * ~1000 px source is never blown up across a wide crop), a 3:2 crop below
 * the text on phones. Never stretched full-bleed.
 *
 * The app bar shows only the mark below 640 px, so the hero carries the
 * full lockup there; from 640 px the bar's lockup is enough.
 */
export async function Hero() {
  const t = await getTranslations("HomePage");

  return (
    <PanelFrame aria-labelledby="hero-title" className="pt-2 sm:pt-4">
      <Panel tone="ink">
        {/* Phones: top right, behind the headline (the photo covers the bottom).
            From md: bottom left, behind the text column. */}
        <MarkBackdrop className="-top-24 -right-40 size-120 text-inverse-foreground/5 md:top-auto md:right-auto md:-bottom-64 md:-left-48 md:size-200" />

        <div className={marketingColumn}>
          <div className="flex min-w-0 flex-col pt-8 pb-10 sm:pt-14 sm:pb-12 md:w-7/12 md:py-20 md:pr-10 lg:py-24 xl:w-2/3 xl:py-32">
            <LogoLockup height={32} className="mb-12 self-start text-inverse-foreground sm:hidden" />
            <h1
              id="hero-title"
              className={cn(
                displayWrap,
                "font-display text-display-sm text-balance lowercase sm:text-display xl:text-display-lg",
              )}
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
        <div className="px-2 pb-2 md:absolute md:inset-y-0 md:right-0 md:w-5/12 md:py-2 md:pl-0 xl:w-1/3">
          <div className="relative aspect-3/2 overflow-hidden rounded-sheet md:aspect-auto md:h-full">
            <Image
              src={whitewater}
              alt={t("hero.photoAlt")}
              fill
              preload
              placeholder="blur"
              sizes="(min-width: 1280px) 427px, (min-width: 768px) 42vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Panel>
    </PanelFrame>
  );
}
