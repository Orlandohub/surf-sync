import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Compass, Waves } from "lucide-react";
import { LogoLockup } from "@/components/brand/logo";
import { auth } from "@/lib/auth/server";

export default async function Home() {
  // Authenticated users never see the marketing page — straight to
  // their own dashboard.
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect(session.user.type === "instructor" ? "/instructor" : "/school");
  }

  const t = await getTranslations("HomePage");

  return (
    <main className="flex flex-1 flex-col">
      {/* Splash — full-bleed coast photography, brand surface (DESIGN.md §10). */}
      <section className="relative flex min-h-[86vh] flex-col justify-end overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- local brand asset, no optimizer needed */}
        <img
          src="/brand/hero-surfers-beach.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="scrim absolute inset-x-0 bottom-0 h-3/4" />
        <div className="relative mx-auto w-full max-w-6xl px-gutter pb-16 pt-28">
          <div className="mb-10 text-inverse-foreground">
            <LogoLockup height={34} />
          </div>
          <h1 className="max-w-3xl text-balance font-display text-display-lg lowercase text-inverse-foreground">
            {t("heroTitle")}{" "}
            <span className="text-ocean-300">{t("heroTitleAccent")}</span>
          </h1>
          <p className="mt-4 max-w-md text-body-lg text-inverse-foreground/85">
            {t("tagline")}
          </p>
          <p className="mt-2 text-meta tabular-nums text-inverse-foreground/70">
            Lisboa · Cascais · Ericeira
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-control bg-primary px-6 text-label text-primary-foreground transition-[background-color,transform] duration-(--duration-fast) ease-move hover:bg-primary-hover active:scale-98"
            >
              {t("cta.signUp")}
              <ArrowRight className="size-5" strokeWidth={1.75} />
            </Link>
            <Link
              href="/sign-in"
              className="glass inline-flex h-13 items-center justify-center gap-2 rounded-control px-6 text-label text-foreground transition-colors duration-(--duration-fast) hover:bg-card"
            >
              {t("cta.signIn")}
              <ArrowRight className="size-5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </section>

      {/* What it is — calm off-white, two-up marketing cards. */}
      <section className="mx-auto grid w-full max-w-6xl gap-stack px-gutter py-section sm:grid-cols-2">
        <div className="rounded-card border bg-card p-card shadow-card">
          <Compass className="size-7 text-primary" strokeWidth={1.75} />
          <h2 className="mt-4 font-display text-display-sm lowercase">
            {t("forSchools.title")}
          </h2>
          <p className="mt-3 text-body text-muted-foreground">
            {t("forSchools.description")}
          </p>
        </div>
        <div className="rounded-card border bg-card p-card shadow-card">
          <Waves className="size-7 text-primary" strokeWidth={1.75} />
          <h2 className="mt-4 font-display text-display-sm lowercase">
            {t("forInstructors.title")}
          </h2>
          <p className="mt-3 text-body text-muted-foreground">
            {t("forInstructors.description")}
          </p>
        </div>
      </section>

      <p className="mx-auto w-full max-w-6xl px-gutter pb-section text-meta text-muted-foreground">
        {t("coastLine")}
      </p>
    </main>
  );
}
