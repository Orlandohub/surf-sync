import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { CalendarCheck } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getInstructorOnboarding } from "@/lib/services/instructor";
import { listInstructorBookings } from "@/lib/services/booking";
import { PageContainer } from "@/components/shell/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading, SectionLink } from "@/components/ui/section-heading";
import { StatTile } from "@/components/ui/stat-tile";
import { ActionBanner } from "@/components/ui/list-row";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarWave } from "@/components/brand/icons";
import { InstructorBookingRow } from "@/components/instructor/booking-row";
import { OnboardingChecklist } from "@/components/instructor/onboarding-checklist";
import { PausedNotice } from "@/components/instructor/paused-notice";
import { StatusLine } from "@/components/instructor/status-line";
import {
  groupInstructorBookings,
  monthStats,
  toInstructorBooking,
} from "@/components/instructor/booking-groups";
import { lisbonToday } from "@/lib/format";

export async function generateMetadata() {
  const t = await getTranslations("InstructorHomePage");
  return { title: t("title") };
}

/** Rows per section on Início; the rest is one tap away in Aulas. */
const PREVIEW = 3;

export default async function InstructorHomePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.type !== "instructor") redirect("/");

  const [t, format, onboarding, bookings] = await Promise.all([
    getTranslations("InstructorHomePage"),
    getFormatter(),
    getInstructorOnboarding(session.user.id),
    listInstructorBookings(session.user.id),
  ]);

  const name = onboarding.displayName ?? session.user.name ?? "";
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  const status = onboarding.profileStatus;
  const onboardingOpen = status === null || status === "incomplete";

  const header = (
    <PageHeader
      title={firstName ? t("greeting", { name: firstName }) : t("greetingNoName")}
      description={<StatusLine onboarding={onboarding} />}
    />
  );

  if (onboardingOpen) {
    // Same container as every other tab (content starts under the logo);
    // the checklist itself keeps a readable width.
    return (
      <PageContainer>
        {header}
        <OnboardingChecklist
          onboarding={onboarding}
          email={session.user.email}
          className="lg:max-w-2xl"
        />
      </PageContainer>
    );
  }

  const today = lisbonToday();
  const all = bookings.map(toInstructorBooking);
  const { requests, upcoming } = groupInstructorBookings(all, today);
  const stats = monthStats(all, today);
  const hours = format.number(stats.hours, { maximumFractionDigits: 1 });
  // The availability nudge is for instructors who've been taking lessons a
  // while, not someone who set their days a moment ago to activate.
  const showBanner = status === "active" && bookings.length > 0;

  return (
    <PageContainer>
      {header}

      {status === "inactive" && <PausedNotice hasAvailability={onboarding.hasAvailability} />}

      <div className="grid items-start gap-section lg:grid-cols-3">
        <div className="flex flex-col gap-section lg:col-span-2">
          {requests.length > 0 && (
            <section aria-labelledby="pedidos" className="flex flex-col gap-3">
              <SectionHeading
                id="pedidos"
                title={t("requests.title")}
                action={
                  <SectionLink href="/instructor/bookings?tab=requests">
                    {t("requests.viewAll")}
                  </SectionLink>
                }
              />
              <ul role="list" className="flex flex-col gap-stack">
                {requests.slice(0, PREVIEW).map((b) => (
                  <li key={b.id}>
                    <InstructorBookingRow booking={b} today={today} view="request" />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="proximas" className="flex flex-col gap-3">
            <SectionHeading
              id="proximas"
              title={t("upcoming.title")}
              action={
                upcoming.length > 0 ? (
                  <SectionLink href="/instructor/bookings?tab=upcoming">
                    {t("upcoming.viewAll")}
                  </SectionLink>
                ) : undefined
              }
            />
            {upcoming.length > 0 ? (
              <ul role="list" className="flex flex-col gap-stack">
                {upcoming.slice(0, PREVIEW).map((b) => (
                  <li key={b.id}>
                    <InstructorBookingRow
                      booking={b}
                      today={today}
                      view="upcoming"
                      actions={false}
                      clampNote
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                as="h3"
                icon={CalendarCheck}
                title={t("upcoming.emptyTitle")}
                description={t("upcoming.emptyDescription")}
              />
            )}
          </section>
        </div>

        <section aria-labelledby="estatisticas" className="flex flex-col gap-3">
          <SectionHeading id="estatisticas" title={t("stats.title")} />
          <div className="grid grid-cols-2 gap-stack">
            <StatTile value={stats.lessons} label={t("stats.lessons")} />
            <StatTile value={hours} label={t("stats.hours")} />
          </div>
        </section>

        {/* At the end, after the person's own data (under the main column on desktop). */}
        {showBanner && (
          <ActionBanner
            className="lg:col-span-2"
            href="/instructor/availability"
            icon={CalendarWave}
            title={t("banner.title")}
            description={t("banner.description")}
          />
        )}
      </div>
    </PageContainer>
  );
}
