import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getSchoolDashboard } from "@/lib/services/school";
import { SchoolDashboard } from "@/components/school/school-dashboard";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("SchoolDashboardPage");
  return { title: t("title") };
}

export default async function SchoolPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  if (session.user.type !== "school_staff") redirect("/");

  const data = await getSchoolDashboard(session.user.id);

  return <SchoolDashboard data={data} />;
}
