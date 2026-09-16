import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getInstructorOnboarding, getInstructorProfileData } from "@/lib/services/instructor";
import { InstructorDashboard } from "@/components/instructor/instructor-dashboard";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("InstructorDashboardPage");
  return { title: t("title") };
}

export default async function InstructorPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  if (session.user.type !== "instructor") redirect("/");

  const onboarding = await getInstructorOnboarding(session.user.id);
  const data = await getInstructorProfileData(session.user.id);

  return <InstructorDashboard onboarding={onboarding} data={data} />;
}
