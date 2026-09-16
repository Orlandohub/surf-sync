import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Verificar email",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const t = await getTranslations("VerifyEmailPage");
  const params = await searchParams;

  // Better Auth redirects to the BARE callbackURL on success (token stripped)
  // and appends `?error=CODE` on failure — so ANY error param means failure
  // and no error param means success. Codes are uppercase in 1.6
  // (INVALID_TOKEN, TOKEN_EXPIRED, ...); match any of them.
  const failed = Boolean(params.error);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-border p-8 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          {failed ? t("failedTitle") : t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {failed ? t("failedDescription") : t("description")}
        </p>
        <a href="/sign-up" className="text-sm underline underline-offset-4">
          {t("backToSignUp")}
        </a>
      </div>
    </main>
  );
}
