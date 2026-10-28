import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, CalendarCheck, Clock3, History } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { listSchoolBookings } from "@/lib/services/booking";
import { listNotifications, unreadCount } from "@/lib/services/notifications";
import { findSchoolIdForUser } from "@/lib/services/school-overview";
import { PageContainer } from "@/components/shell/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { LinkTabs } from "@/components/ui/link-tabs";
import { TabCount } from "@/components/ui/tab-styles";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { BookingRow } from "@/components/school/booking-row";
import { SchoolNotifications } from "@/components/school/school-notifications";
import { NotificationsJump } from "@/components/shell/notifications-section";
import { bookingList, groupBookings, type BookingList } from "@/lib/booking-view";
import { lisbonToday } from "@/lib/format";

export async function generateMetadata() {
  const t = await getTranslations("SchoolBookingsPage");
  return { title: t("title") };
}

/**
 * The shared lists (lib/booking-view) at the school's URLs: requests are
 * "Pendentes", the default tab (no ?tab); the others keep their names.
 */
const LIST_HREF: Record<BookingList, string> = {
  requests: "/school/bookings",
  upcoming: "/school/bookings?tab=upcoming",
  history: "/school/bookings?tab=history",
};
const LISTS = ["requests", "upcoming", "history"] as const satisfies readonly BookingList[];

const EMPTY_ICON = { requests: Clock3, upcoming: CalendarCheck, history: History } as const;

export default async function SchoolBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.type !== "school_staff") redirect("/");
  // A brand-new school account creates its school first (on Início).
  if (!(await findSchoolIdForUser(session.user.id))) redirect("/school");

  const { tab: tabParam } = await searchParams;
  const tab: BookingList = tabParam === "upcoming" || tabParam === "history" ? tabParam : "requests";

  const [bookings, notifications, unread, t] = await Promise.all([
    listSchoolBookings(session.user.id),
    listNotifications(session.user.id),
    unreadCount(session.user.id),
    getTranslations("SchoolBookingsPage"),
  ]);
  const today = lisbonToday();
  const groups = groupBookings(bookings, today);
  const shown = groups[tab];

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={t("description")}
        // Phones: notifications sit after the bookings, so the bell jumps there.
        action={<NotificationsJump unread={unread} />}
      />

      <div className="grid grid-cols-1 items-start gap-section lg:grid-cols-3">
        <section aria-labelledby="reservas-lista" className="flex flex-col gap-4 lg:col-span-2">
          {/* tabIndex: where focus goes when a cancelled row leaves the list. */}
          <h2 id="reservas-lista" tabIndex={-1} className="sr-only">
            {t(`tabs.${tab}`)}
          </h2>
          <LinkTabs
            label={t("tabs.label")}
            value={tab}
            items={LISTS.map((value) => ({
              value,
              href: LIST_HREF[value],
              label: t(`tabs.${value}`),
              badge:
                value === "requests" && groups.requests.length > 0 ? (
                  <TabCount
                    count={groups.requests.length}
                    label={t("tabs.requestsCount", { count: groups.requests.length })}
                  />
                ) : undefined,
            }))}
          />
          {shown.length > 0 ? (
            <ul role="list" className="flex flex-col gap-stack">
              {shown.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  today={today}
                  cancellable
                  // Only name the requester when it was a colleague.
                  showRequester={b.requestedByName !== session.user.name}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={EMPTY_ICON[tab]}
              as="h3"
              title={t(`empty.${tab}.title`)}
              description={t(`empty.${tab}.description`)}
              action={
                tab === "history" ? undefined : (
                  // The screen's only action, so primary (COMPONENTS.md "Empty state").
                  <Link href="/school/discovery" className={buttonVariants()}>
                    {t("empty.action")}
                    <ArrowRight aria-hidden strokeWidth={1.75} />
                  </Link>
                )
              }
            />
          )}
        </section>

        <SchoolNotifications
          notifications={notifications}
          unread={unread}
          placeOf={new Map(bookings.map((b) => [b.id, bookingList(b, today)]))}
          listHref={LIST_HREF}
        />
      </div>
    </PageContainer>
  );
}
