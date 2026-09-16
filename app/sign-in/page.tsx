import { SignInForm } from "@/components/auth/sign-in-form";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("SignInPage");
  return { title: t("title") };
}

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <SignInForm />
    </main>
  );
}
