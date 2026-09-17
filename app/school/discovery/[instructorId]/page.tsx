import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getInstructorForSchool } from "@/lib/services/discovery";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingRequestForm } from "@/components/school/booking-request-form";

export async function generateMetadata() {
  const t = await getTranslations("DiscoveryPage");
  return { title: t("profile.title") };
}

export default async function InstructorProfilePage({
  params,
}: {
  params: Promise<{ instructorId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  if (session.user.type !== "school_staff") redirect("/");

  const { instructorId } = await params;

  let instructor;
  try {
    instructor = await getInstructorForSchool(session.user.id, instructorId);
  } catch {
    notFound();
  }

  const t = await getTranslations("DiscoveryPage");

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-4 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-1">
        <Link href="/school/discovery" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          ← {t("backToSearch")}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{instructor.displayName}</h1>
        <p className="text-sm text-muted-foreground">
          {t(`experience.${instructor.experienceLevel}`)}
          {instructor.locations.length > 0 && ` · ${instructor.locations.join(", ")}`}
        </p>
      </div>

      {instructor.bio && (
        <div className="w-full max-w-2xl rounded-lg border border-border p-6">
          <h2 className="text-base font-medium">{t("profile.bio")}</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{instructor.bio}</p>
        </div>
      )}

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-6">
          <h2 className="text-base font-medium">{t("profile.locations")}</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
            {instructor.locations.map((l) => (
              <li key={l}>{l}</li>
            ))}
            {instructor.locations.length === 0 && <li>{t("profile.none")}</li>}
          </ul>
        </div>
        <div className="rounded-lg border border-border p-6">
          <h2 className="text-base font-medium">{t("profile.availability")}</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
            {instructor.availableDays.map((d) => (
              <li key={d}>{t(`days.${d}`)}</li>
            ))}
            {instructor.availableDays.length === 0 && <li>{t("profile.none")}</li>}
          </ul>
        </div>
      </div>

      <BookingRequestForm instructorId={instructor.userId} />
    </main>
  );
}
