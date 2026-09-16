import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { AccountSettings } from "@/components/auth/account-settings";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("AccountSettingsPage");
  return { title: t("title") };
}

export default async function AccountSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  return (
    <main className="flex flex-1 items-start justify-center px-4 py-16">
      <AccountSettings
        userName={session.user.name}
        userEmail={session.user.email}
      />
    </main>
  );
}
