import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { searchInstructors, listLocations, searchSchema } from "@/lib/services/discovery";
import { DiscoverySearch } from "@/components/school/discovery-search";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("DiscoveryPage");
  return { title: t("title") };
}

export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; experience?: string; day?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  if (session.user.type !== "school_staff") redirect("/");

  const params = await searchParams;
  const parsed = searchSchema.safeParse({
    locationId: params.location,
    experience: params.experience,
    day: params.day,
  });
  const filters = parsed.success ? parsed.data : {};

  const [results, locations] = await Promise.all([
    searchInstructors(session.user.id, filters),
    listLocations(),
  ]);

  return <DiscoverySearch results={results} locations={locations} />;
}
