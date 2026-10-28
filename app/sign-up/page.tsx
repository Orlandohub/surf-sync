import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { isAccountType } from "@/components/auth/auth-helpers";

export async function generateMetadata() {
  const t = await getTranslations("SignUpPage");
  return { title: t("title") };
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  // Signed-in users have no business on signup — send them home.
  const session = await getSession();
  if (session) redirect("/");

  // Optional preselection, e.g. /sign-up?type=instructor from a landing CTA.
  const { type } = await searchParams;

  return (
    <AuthLayout>
      <SignUpForm defaultType={isAccountType(type) ? type : null} />
    </AuthLayout>
  );
}
