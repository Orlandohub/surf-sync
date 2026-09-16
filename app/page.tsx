import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("HomePage");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">SurfSync</h1>
        <p className="max-w-md text-balance text-muted-foreground">
          {t("tagline")}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/sign-up"
          className="flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("cta.signUp")}
        </Link>
        <Link
          href="/sign-in"
          className="flex h-11 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium transition-colors hover:bg-accent"
        >
          {t("cta.signIn")}
        </Link>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-6">
          <h2 className="text-base font-medium">{t("forSchools.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("forSchools.description")}
          </p>
        </div>
        <div className="rounded-lg border border-border p-6">
          <h2 className="text-base font-medium">{t("forInstructors.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("forInstructors.description")}
          </p>
        </div>
      </div>
    </main>
  );
}
