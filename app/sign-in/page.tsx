import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SignInForm } from "@/components/auth/sign-in-form";
import { safeNextPath } from "@/components/auth/auth-helpers";

export async function generateMetadata() {
  const t = await getTranslations("SignInPage");
  return { title: t("title") };
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; next?: string }>;
}) {
  // ?reset=success after a password reset (ResetPasswordForm).
  // ?next=/verify-email from a dead confirmation link: back there after
  // signing in, where the new email is one tap away. Paths on this site only.
  const { reset, next: nextParam } = await searchParams;
  const next = safeNextPath(nextParam);

  // Signed-in users skip the login form.
  const session = await getSession();
  if (session) redirect(next ?? "/");

  return (
    <AuthLayout>
      <SignInForm resetSuccess={reset === "success"} next={next} />
    </AuthLayout>
  );
}
