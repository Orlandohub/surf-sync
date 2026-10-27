import * as React from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { LogoLockup } from "@/components/brand/logo";
import whitewater from "@/public/brand/whitewater-aerial.jpg";

/**
 * The frame of every auth screen (/sign-in, /sign-up, /forgot-password,
 * /reset-password, /verify-email) — a brand surface (DESIGN.md §2, §6).
 *
 * ≥ lg: a split, aligned with the app bar's column — the form column
 *   (400px) and a brand panel: the whitewater aerial, lightly veiled and
 *   scrimmed for legibility, the white lockup and one lowercase display
 *   line. The form is anchored to the top, its h1 level with the lockup,
 *   so errors and notices grow downwards instead of shifting the heading.
 *   The panel is sticky and one viewport tall, so a long form (sign-up)
 *   scrolls past it without pushing the line away.
 * < lg: the form comes first; a compact photo band with the lockup closes
 *   the page, pushed to the bottom of the viewport on short screens. It is
 *   there for signed-out visitors, whose mobile app bar shows only the mark;
 *   signed-in visitors already see the lockup in the app bar, so they don't
 *   get it.
 *
 * The global app bar stays above it with one quiet link.
 */
export async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [t, session] = await Promise.all([getTranslations("Auth.layout"), getSession()]);

  return (
    <main
      data-slot="auth-page"
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-gutter pt-6 pb-section md:pt-12 lg:flex-row lg:gap-16 lg:py-0"
    >
      <div className="flex w-full max-w-100 flex-col self-center lg:w-100 lg:shrink-0 lg:self-auto lg:py-16">
        {children}
      </div>

      {/* Brand panel (lg+). Decorative: the photo has no alt, the lockup
          repeats the app bar's logo. The display line is real text. The
          frame is one screen below the app bar (at least 528 px); the
          panel fills it inside its py-6. */}
      <div className="hidden flex-1 lg:sticky lg:top-(--top-chrome) lg:block lg:h-(--viewport-below-chrome) lg:min-h-132 lg:self-start lg:py-6">
        <div
          data-slot="auth-brand"
          className="relative h-full overflow-hidden rounded-panel bg-brand-panel"
        >
          {/* Above the fold: load eagerly. Portrait photo under
              object-cover in a tall panel: its rendered width is about
              0.8 × the panel height, so `sizes` follows the viewport
              height. Below lg the panel is hidden and 1px picks the
              smallest candidate. */}
          <Image
            src={whitewater}
            alt=""
            fill
            placeholder="blur"
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 64rem) 80vh, 1px"
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

      {/* Compact brand band (< lg, signed out), after the form. */}
      {!session && (
        <div
          aria-hidden
          data-slot="auth-band"
          className="relative mt-auto h-24 w-full max-w-100 shrink-0 self-center overflow-hidden rounded-card bg-brand-panel lg:hidden"
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
      )}
    </main>
  );
}
