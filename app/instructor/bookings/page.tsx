import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, CalendarCheck, History, Inbox } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { listInstructorBookings } from "@/lib/services/booking";
import { getInstructorOnboarding } from "@/lib/services/instructor";
import { listNotifications, unreadCount } from "@/lib/services/notifications";
import { PageContainer } from "@/components/shell/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { LinkTabs } from "@/components/ui/link-tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { InstructorBookingRow } from "@/components/instructor/booking-row";
import { NotificationsPanel } from "@/components/instructor/notifications-panel";
import {
  groupInstructorBookings,
  toInstructorBooking,
} from "@/components/instructor/booking-groups";
import { lisbonToday } from "@/lib/format";

export async function generateMetadata() {
  const t = await getTranslations("InstructorBookingsPage");
  return { title: t("title") };
}

const TABS = ["requests", "upcoming", "history"] as const;
type Tab = (typeof TABS)[number];

const EMPTY_ICON = { requests: Inbox, upcoming: CalendarCheck, history: History } as const;

export default async function InstructorBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.type !== "instructor") redirect("/");

  const [t, params, bookings, notifications, unread, onboarding] = await Promise.all([
    getTranslations("InstructorBookingsPage"),
    searchParams,
    listInstructorBookings(session.user.id),
    listNotifications(session.user.id),
    unreadCount(session.user.id),
    getInstructorOnboarding(session.user.id),
  ]);

  const today = lisbonToday();
  const groups = groupInstructorBookings(bookings.map(toInstructorBooking), today);
  const requested = typeof params.tab === "string" ? params.tab : undefined;
  // No tab in the URL: open on the requests when there are any to answer.
  const tab: Tab = TABS.includes(requested as Tab)
    ? (requested as Tab)
    : groups.requests.length > 0
      ? "requests"
      : "upcoming";
  const list = groups[tab];
  const view = tab === "requests" ? "request" : tab === "upcoming" ? "upcoming" : "history";
  // Nothing can arrive while the profile is off: say so, and point to Início.
  const inactiveEmpty = onboarding.profileStatus !== "active" && tab !== "history";

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid items-start gap-section lg:grid-cols-3">
        <section aria-label={t(`tabs.${tab}`)} className="flex flex-col gap-4 lg:col-span-2">
          <LinkTabs
            label={t("tabs.label")}
            value={tab}
            items={TABS.map((value) => ({
              value,
              href: `/instructor/bookings?tab=${value}`,
              label: t(`tabs.${value}`),
              badge:
                value === "requests" && groups.requests.length > 0 ? (
                  <Badge variant="count">{groups.requests.length}</Badge>
                ) : undefined,
            }))}
          />

          {list.length > 0 ? (
            <ul role="list" className="flex flex-col gap-stack">
              {list.map((b) => (
                <li key={b.id}>
                  <InstructorBookingRow booking={b} today={today} view={view} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={EMPTY_ICON[tab]}
              title={t(`empty.${tab}.title`)}
              description={
                inactiveEmpty ? t("empty.inactive.description") : t(`empty.${tab}.description`)
              }
              action={
                inactiveEmpty ? (
                  <Link href="/instructor" className={buttonVariants()}>
                    {t("empty.inactive.action")}
                    <ArrowRight aria-hidden strokeWidth={1.75} />
                  </Link>
                ) : undefined
              }
            />
          )}
        </section>

        <NotificationsPanel notifications={notifications} unread={unread} />
      </div>
    </PageContainer>
  );
}
