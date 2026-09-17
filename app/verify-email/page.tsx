import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/server";
import { ContinueLink } from "@/components/auth/continue-link";

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

  // Email verification signs the user in — offer the right destination.
  const session = await auth.api.getSession({ headers: await headers() });
  const destination = session
    ? session.user.type === "instructor"
      ? "/instructor"
      : "/school"
    : "/sign-in";

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-[var(--radius)] border border-border bg-card p-8 text-center shadow-[var(--ss-shadow-md)]">
        <h1 className="text-xl font-semibold tracking-tight">
          {failed ? t("failedTitle") : t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {failed ? t("failedDescription") : t("description")}
        </p>
        <ContinueLink
          href={destination}
          label={failed ? t("backToSignIn") : t("continue")}
        />
      </div>
    </main>
  );
}
