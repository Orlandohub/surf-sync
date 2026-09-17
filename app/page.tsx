import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { WaveGlyph } from "@/components/brand/wave-glyph";

export default async function Home() {
  const t = await getTranslations("HomePage");

  return (
    <main className="flex flex-1 flex-col items-center gap-14 px-4 py-20">
      <div className="flex max-w-2xl flex-col items-center gap-5 text-center">
        <span className="eyebrow">Lisboa · Cascais · Ericeira</span>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {t("heroTitle")}{" "}
          <span className="display-serif-italic text-teal-300">{t("heroTitleAccent")}</span>
        </h1>
        <p className="max-w-md text-balance text-base text-muted-foreground">
          {t("tagline")}
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="flex h-11 items-center justify-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition-all duration-[140ms] hover:bg-teal-400 hover:shadow-[var(--ss-shadow-glow)] active:translate-y-px"
          >
            {t("cta.signUp")}
          </Link>
          <Link
            href="/sign-in"
            className="flex h-11 items-center justify-center rounded-full border border-border px-7 text-sm font-medium transition-colors duration-[220ms] hover:border-teal-500 hover:text-teal-300"
          >
            {t("cta.signIn")}
          </Link>
        </div>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--radius)] border border-border bg-card p-7 shadow-[var(--ss-shadow-md)]">
          <WaveGlyph name="compass" size={28} className="text-teal-500" />
          <h2 className="mt-4 text-lg font-semibold">{t("forSchools.title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("forSchools.description")}
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-border bg-card p-7 shadow-[var(--ss-shadow-md)]">
          <WaveGlyph name="swell" size={28} className="text-teal-500" />
          <h2 className="mt-4 text-lg font-semibold">{t("forInstructors.title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("forInstructors.description")}
          </p>
        </div>
      </div>

      <p className="font-mono-label text-muted-foreground">{t("coastLine")}</p>
    </main>
  );
}
