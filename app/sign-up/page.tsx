import { SignUpForm } from "@/components/auth/sign-up-form";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("SignUpPage");
  return { title: t("title") };
}

export default function SignUpPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <SignUpForm />
    </main>
  );
}
