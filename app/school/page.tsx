import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, CalendarCheck, ChevronRight } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getSchoolDashboard } from "@/lib/services/school";
import { listSchoolBookings } from "@/lib/services/booking";
import { countSavedInstructors } from "@/lib/services/school-overview";
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
import { groupBookings, monthLessons, weekLessons } from "@/lib/booking-view";
import { lisbonToday } from "@/lib/format";

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
  const [bookings, savedCount] = await Promise.all([
    listSchoolBookings(session.user.id),
    countSavedInstructors(session.user.id),
  ]);
  const today = lisbonToday();
  const { requests, upcoming } = groupBookings(bookings, today);
  // Real numbers only: requests still waiting, and lessons (accepted or
  // completed) this week and this calendar month.
  const stats = {
    pending: requests.length,
    thisWeek: weekLessons(bookings, today),
    thisMonth: monthLessons(bookings, today).lessons,
  };
  // A brand-new school has nothing to count yet: no row of zeros, the
  // header's "Encontrar instrutores" and Equipa are the next steps.
  const showStats = bookings.length > 0 || savedCount > 0;

  // Tiles that open exactly what they count say so with a chevron; the
  // period tiles have no single list to open, so they aren't links. The
  // chevron stays with the last word when the label wraps on phones.
  const linked = (label: string) => {
    const cut = label.lastIndexOf(" ") + 1;
    return (
      <>
        {label.slice(0, cut)}
        <span className="whitespace-nowrap">
          {label.slice(cut)}
          <ChevronRight aria-hidden className="ml-0.5 inline-block size-4 align-middle" strokeWidth={1.75} />
        </span>
      </>
    );
  };

  return (
    <PageContainer>
      {/* The h1 takes focus after "Criar escola" turns the page into this
          (PageHeader's h1 is focusable from script). */}
      <PageHeader
        leading={
          <>
            <Avatar name={school.name} size={88} className="max-md:hidden" />
            <Avatar name={school.name} size={44} className="md:hidden" />
          </>
        }
        title={school.name}
        description={t("address", { address: school.address, city: school.city })}
        stackAction
        action={
          <Link href="/school/discovery" className={buttonVariants()}>
            {t("findInstructors")}
            <ArrowRight aria-hidden strokeWidth={1.75} />
          </Link>
        }
      />

      {showStats && (
        <section aria-labelledby="resumo" className="@container">
          <h2 id="resumo" className="sr-only">
            {t("stats.heading")}
          </h2>
          {/* justify-start: values stay level when a label wraps on phones.
              By the section's width in rem (larger text counts): 4-up from
              42rem, 2-up from 18rem, one per row below that, so a label is
              never squeezed out of its tile. */}
          <div className="grid grid-cols-1 gap-stack @2xs:grid-cols-2 @2xl:grid-cols-4">
            <StatTile
              value={stats.pending}
              label={linked(t("stats.pending"))}
              href="/school/bookings"
              className="justify-start"
            />
            <StatTile value={stats.thisWeek} label={t("stats.thisWeek")} className="justify-start" />
            <StatTile value={stats.thisMonth} label={t("stats.thisMonth")} className="justify-start" />
            <StatTile
              value={savedCount}
              label={linked(t("stats.saved"))}
              href="/school/discovery?view=saved"
              className="justify-start"
            />
          </div>
        </section>
      )}

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
                <BookingRow
                  key={b.id}
                  booking={b}
                  today={today}
                  showStatus={false}
                  showRequester={false}
                  clampNote
                />
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
                    <ArrowRight aria-hidden strokeWidth={1.75} />
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
