import { cache } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getInstructorForSchool } from "@/lib/services/discovery";
import { findSchoolIdForUser, listVerifiedInstructorIds } from "@/lib/services/school-overview";
import { PageContainer } from "@/components/shell/page-container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Avatar } from "@/components/ui/avatar";
import { BookmarkToggle } from "@/components/school/bookmark-toggle";
import { LevelBadge, VerifiedMark } from "@/components/school/instructor-bits";
import { WeeklyAvailability } from "@/components/school/weekly-availability";
import { BookingRequestForm } from "@/components/school/booking-request-form";
import { DAY_KEYS, formatSlot, type DayKey } from "@/lib/format";

/** This request's time: the booking form builds its date list from it on
 *  the server and again on the client, so both lists match. */
const requestTime = () => Date.now();

/** One lookup per request, shared by generateMetadata and the page. */
const loadInstructor = cache(async (userId: string, instructorId: string) => {
  try {
    return await getInstructorForSchool(userId, instructorId);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ instructorId: string }> }) {
  const t = await getTranslations("DiscoveryPage.profile");
  const session = await getSession();
  const { instructorId } = await params;
  const instructor =
    session?.user.type === "school_staff" ? await loadInstructor(session.user.id, instructorId) : null;
  return { title: instructor?.displayName ?? t("metaTitle") };
}

export default async function InstructorProfilePage({
  params,
}: {
  params: Promise<{ instructorId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.type !== "school_staff") redirect("/");
  if (!(await findSchoolIdForUser(session.user.id))) redirect("/school");

  const { instructorId } = await params;
  const instructor = await loadInstructor(session.user.id, instructorId);
  if (!instructor) notFound();

  const [t, verifiedIds] = await Promise.all([
    getTranslations("DiscoveryPage"),
    listVerifiedInstructorIds([instructor.userId]),
  ]);
  const verified = verifiedIds.includes(instructor.userId);

  // Weekday → "HH:MM" range, in week order, for the list and the form.
  const slots = DAY_KEYS.flatMap((day) => {
    const s = instructor.availabilitySlots.find((a) => a.day === day);
    return s ? [{ day, start: formatSlot(s.startTime), end: formatSlot(s.endTime) }] : [];
  }) satisfies { day: DayKey; start: string; end: string }[];

  return (
    <PageContainer>
      <header className="flex flex-col gap-5">
        <Link
          href="/school/discovery"
          className="tap -ml-1 inline-flex w-fit items-center gap-0.5 rounded-chip text-meta font-medium text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" strokeWidth={1.75} />
          {t("profile.back")}
        </Link>
        <div className="flex items-start gap-4 md:items-center md:gap-5">
          <Avatar name={instructor.displayName} size={88} className="max-md:hidden" />
          <Avatar name={instructor.displayName} size={44} className="mt-0.5 md:hidden" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="flex items-center gap-2 text-headline text-balance text-foreground">
              <span className="min-w-0">{instructor.displayName}</span>
              {verified && <VerifiedMark className="size-5" />}
            </h1>
            {instructor.locations.length > 0 && (
              <p className="text-body text-muted-foreground">{instructor.locations.join(", ")}</p>
            )}
            <div className="mt-1 flex">
              <LevelBadge level={instructor.experienceLevel} />
            </div>
          </div>
          <BookmarkToggle
            instructorId={instructor.userId}
            name={instructor.displayName}
            bookmarked={instructor.bookmarked}
            className="border border-input max-md:-mt-1"
          />
        </div>
      </header>

      <div className="flex flex-col gap-section lg:grid lg:grid-cols-5 lg:items-start lg:gap-x-8">
        <div className="flex flex-col gap-section lg:col-span-3">
          {instructor.bio && (
            <section aria-labelledby="sobre" className="flex flex-col gap-3">
              <SectionHeading id="sobre" title={t("profile.about")} />
              <p className="max-w-prose text-body whitespace-pre-line text-foreground">{instructor.bio}</p>
            </section>
          )}
          <section aria-labelledby="disponibilidade" className="flex flex-col gap-3">
            <SectionHeading
              id="disponibilidade"
              title={t("profile.availability")}
              description={t("profile.availabilityDescription")}
            />
            <WeeklyAvailability slots={slots} />
          </section>
        </div>

        <BookingRequestForm instructorId={instructor.userId} slots={slots} now={requestTime()} />
      </div>
    </PageContainer>
  );
}
