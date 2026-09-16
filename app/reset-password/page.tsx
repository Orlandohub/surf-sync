import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("ResetPasswordPage");
  return { title: t("title") };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const t = await getTranslations("ResetPasswordPage");
  const params = await searchParams;

  // Better Auth's /api/auth/reset-password/:token callback redirects here
  // with ?token=... on success or ?error=INVALID_TOKEN when the link is
  // expired or already used. A bare visit (no token, no error) is treated
  // as invalid too — the form is useless without a token.
  const hasToken = Boolean(params.token);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      {hasToken ? (
        <ResetPasswordForm token={params.token as string} />
      ) : (
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-border p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            {t("invalid.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("invalid.description")}
          </p>
          <a href="/forgot-password" className="text-sm underline underline-offset-4">
            {t("invalid.requestNew")}
          </a>
        </div>
      )}
    </main>
  );
}
