import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getSchoolDashboard } from "@/lib/services/school";
import { SchoolDashboard } from "@/components/school/school-dashboard";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("SchoolDashboardPage");
  return { title: t("title") };
}

export default async function SchoolPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.type !== "school_staff") redirect("/");

  const data = await getSchoolDashboard(session.user.id);

  return <SchoolDashboard data={data} />;
}
