import { getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ResetLinkInvalid } from "@/components/auth/reset-link-invalid";

export async function generateMetadata() {
  const t = await getTranslations("ResetPasswordPage");
  return { title: t("title") };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;

  // Better Auth's /api/auth/reset-password/:token callback redirects here
  // with ?token=... on success or ?error=INVALID_TOKEN when the link is
  // expired or already used. A bare visit (no token, no error) is treated
  // as invalid too — the form is useless without a token.
  return (
    <AuthLayout>
      {params.token ? <ResetPasswordForm token={params.token} /> : <ResetLinkInvalid />}
    </AuthLayout>
  );
}
