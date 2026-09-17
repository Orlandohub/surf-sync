import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/server";

export async function generateMetadata() {
  const t = await getTranslations("SignInPage");
  return { title: t("title") };
}

export default async function SignInPage() {
  // Signed-in users skip the login form.
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <SignInForm />
    </main>
  );
}
