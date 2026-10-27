import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SignInForm } from "@/components/auth/sign-in-form";

export async function generateMetadata() {
  const t = await getTranslations("SignInPage");
  return { title: t("title") };
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  // Signed-in users skip the login form.
  const session = await getSession();
  if (session) redirect("/");

  // ?reset=success after a password reset (ResetPasswordForm).
  const { reset } = await searchParams;

  return (
    <AuthLayout>
      <SignInForm resetSuccess={reset === "success"} />
    </AuthLayout>
  );
}
