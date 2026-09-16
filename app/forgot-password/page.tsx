import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("ForgotPasswordPage");
  return { title: t("title") };
}

export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <ForgotPasswordForm />
    </main>
  );
}
