import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/server";

export async function generateMetadata() {
  const t = await getTranslations("SignUpPage");
  return { title: t("title") };
}

export default async function SignUpPage() {
  // Signed-in users have no business on signup — send them home.
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <SignUpForm />
    </main>
  );
}
