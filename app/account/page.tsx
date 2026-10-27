import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { PageContainer } from "@/components/shell/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { AccountSettings } from "@/components/auth/account-settings";
import { resendStartFor } from "@/components/auth/resend-start";

export async function generateMetadata() {
  const t = await getTranslations("AccountSettingsPage");
  return { title: t("title") };
}

export default async function AccountSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const t = await getTranslations("AccountSettingsPage");

  // Unconfirmed email: start the resend row's cooldown from what the server
  // actually sent (Better Auth hides the limiter's refusals from the client).
  const emailVerified = session.user.emailVerified;
  const resendStart = emailVerified ? undefined : await resendStartFor(session.user.email);

  return (
    <PageContainer width="narrow">
      <PageHeader title={t("title")} />
      <AccountSettings
        userName={session.user.name}
        userEmail={session.user.email}
        userType={session.user.type === "instructor" ? "instructor" : "school_staff"}
        emailVerified={emailVerified}
        resendStart={resendStart}
      />
    </PageContainer>
  );
}
