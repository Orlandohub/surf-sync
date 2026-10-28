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

  // Instructors reach Conta from Perfil (it stays the active tab), so it's
  // a pushed screen with a way back; for schools Conta is a tab of its own.
  const isInstructor = session.user.type === "instructor";

  return (
    <PageContainer width="narrow">
      <PageHeader
        title={t("title")}
        back={isInstructor ? { href: "/instructor/profile", label: t("backToProfile") } : undefined}
      />
      <AccountSettings
        userName={session.user.name}
        userEmail={session.user.email}
        userType={isInstructor ? "instructor" : "school_staff"}
        emailVerified={emailVerified}
        resendStart={resendStart}
      />
    </PageContainer>
  );
}
