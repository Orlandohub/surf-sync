import * as React from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LogoLockup } from "@/components/brand/logo";
import whitewater from "@/public/brand/whitewater-aerial.jpg";

/**
 * The frame of every auth screen (/sign-in, /sign-up, /forgot-password,
 * /reset-password, /verify-email) — a brand surface (DESIGN.md §2, §6).
 *
 * ≥ lg: a split, aligned with the app bar's column — the form column
 *   (400px, vertically centred) and a brand panel: the whitewater aerial,
 *   lightly veiled and scrimmed for legibility, the white lockup and one
 *   lowercase display line. The panel is sticky and one viewport tall, so
 *   a long form (sign-up) scrolls past it without pushing the line away.
 * < lg: the form comes first; a compact photo band with the lockup closes
 *   the page (the mobile app bar only shows the mark, so this is where the
 *   name is seen on phones).
 *
 * The global app bar stays above it with one quiet link.
 */
export async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("Auth.layout");

  return (
    <main
      data-slot="auth-page"
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-gutter pt-6 pb-section md:pt-12 lg:flex-row lg:gap-16 lg:py-0"
    >
      <div className="flex w-full max-w-100 flex-col self-center lg:w-100 lg:shrink-0 lg:justify-center lg:self-auto lg:py-16">
        {children}
      </div>

      {/* Brand panel (lg+). Decorative: the photo has no alt, the lockup
          repeats the app bar's logo. The display line is real text. */}
      <div className="hidden flex-1 lg:sticky lg:top-(--top-chrome) lg:block lg:self-start lg:py-6">
        <div
          data-slot="auth-brand"
          className="relative h-[calc(100svh-var(--top-chrome)-3rem)] min-h-120 overflow-hidden rounded-panel bg-inverse"
        >
          <Image
            src={whitewater}
            alt=""
            fill
            placeholder="blur"
            fetchPriority="high"
            sizes="(min-width: 64rem) 33rem, 1px"
            className="object-cover"
          />
          {/* Foam is near-white: a light ink veil plus the two scrims keep
              the white line above 3:1 (large text) on every pixel and the
              lockup above 4:1 — measured at 1440×900. */}
          <div aria-hidden className="absolute inset-0 bg-black/15" />
          <div aria-hidden className="absolute inset-0 scrim" />
          <div aria-hidden className="absolute inset-0 scrim-top" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div aria-hidden>
              <LogoLockup height={28} />
            </div>
            <p className="max-w-sm font-display text-display-sm text-balance lowercase">{t("tagline")}</p>
          </div>
        </div>
      </div>

      {/* Compact brand band (< lg), after the form. */}
      <div
        aria-hidden
        data-slot="auth-band"
        className="relative h-24 w-full max-w-100 shrink-0 self-center overflow-hidden rounded-card bg-inverse lg:hidden"
      >
        <Image
          src={whitewater}
          alt=""
          fill
          placeholder="blur"
          sizes="(min-width: 64rem) 1px, 25rem"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute inset-0 scrim" />
        <div className="relative flex h-full items-end p-card text-white">
          <LogoLockup height={22} />
        </div>
      </div>
    </main>
  );
}
