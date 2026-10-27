import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, CalendarCheck } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getSchoolDashboard } from "@/lib/services/school";
import { listSchoolBookings } from "@/lib/services/booking";
import { getBookmarkedInstructors } from "@/lib/services/discovery";
import { PageContainer } from "@/components/shell/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading, SectionLink } from "@/components/ui/section-heading";
import { StatTile } from "@/components/ui/stat-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { BookingRow } from "@/components/school/booking-row";
import { TeamSection } from "@/components/school/team-section";
import { CreateSchoolForm } from "@/components/school/create-school-form";
import { bookingStats, groupBookings } from "@/components/school/booking-groups";
import { lisbonToday } from "@/lib/format";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations("SchoolDashboardPage");
  return { title: t("title") };
}

const UPCOMING_MAX = 4;

export default async function SchoolPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.type !== "school_staff") redirect("/");

  // Also accepts a pending staff invitation for this email (service rule).
  const data = await getSchoolDashboard(session.user.id);
  const t = await getTranslations("SchoolDashboardPage");

  if (!data.school) {
    return (
      <PageContainer width="narrow">
        <PageHeader title={t("create.title")} description={t("create.description")} />
        <CreateSchoolForm />
      </PageContainer>
    );
  }

  const school = data.school;
  const [bookings, saved] = await Promise.all([
    listSchoolBookings(session.user.id),
    getBookmarkedInstructors(session.user.id),
  ]);
  const today = lisbonToday();
  const stats = bookingStats(bookings, today);
  const { upcoming } = groupBookings(bookings, today);

  const findInstructors = (
    <Link href="/school/discovery" className={cn(buttonVariants(), "max-sm:w-full")}>
      {t("findInstructors")}
      <ArrowRight aria-hidden strokeWidth={1.75} />
    </Link>
  );

  return (
    <PageContainer>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={school.name} size={88} className="max-md:hidden" />
          <Avatar name={school.name} size={44} className="md:hidden" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="text-headline text-balance text-foreground">{school.name}</h1>
            <p className="text-body text-muted-foreground">
              {t("address", { address: school.address, city: school.city })}
            </p>
          </div>
        </div>
        {findInstructors}
      </header>

      <section aria-labelledby="resumo">
        <h2 id="resumo" className="sr-only">
          {t("stats.heading")}
        </h2>
        <div className="grid grid-cols-2 gap-stack md:grid-cols-4">
          <StatTile value={stats.pending} label={t("stats.pending")} href="/school/bookings" />
          <StatTile value={stats.thisWeek} label={t("stats.thisWeek")} href="/school/bookings?tab=upcoming" />
          <StatTile value={stats.thisMonth} label={t("stats.thisMonth")} />
          <StatTile value={saved.length} label={t("stats.saved")} href="/school/discovery?view=saved" />
        </div>
      </section>

      <div className="flex flex-col gap-section lg:grid lg:grid-cols-5 lg:items-start lg:gap-x-8">
        <section aria-labelledby="proximas" className="flex flex-col gap-3 lg:col-span-3">
          <SectionHeading
            id="proximas"
            title={t("upcoming.title")}
            action={
              upcoming.length > 0 ? (
                <SectionLink href="/school/bookings?tab=upcoming">{t("upcoming.viewAll")}</SectionLink>
              ) : undefined
            }
          />
          {upcoming.length > 0 ? (
            <ul role="list" className="flex flex-col gap-stack">
              {upcoming.slice(0, UPCOMING_MAX).map((b) => (
                <BookingRow key={b.id} booking={b} showStatus={false} showRequester={false} />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={CalendarCheck}
              as="h3"
              title={t("upcoming.emptyTitle")}
              description={
                stats.pending > 0 ? t("upcoming.emptyPendingDescription") : t("upcoming.emptyDescription")
              }
              action={
                stats.pending > 0 ? (
                  <Link href="/school/bookings" className={buttonVariants({ variant: "outline" })}>
                    {t("upcoming.viewPending")}
                  </Link>
                ) : undefined
              }
            />
          )}
        </section>

        <TeamSection
          staff={data.staff}
          pendingInvites={data.pendingInvites}
          currentUserId={session.user.id}
          className="lg:col-span-2"
        />
      </div>
    </PageContainer>
  );
}
