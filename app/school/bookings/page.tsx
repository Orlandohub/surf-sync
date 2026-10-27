import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CalendarCheck, Clock3, History } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { listSchoolBookings } from "@/lib/services/booking";
import { listNotifications, unreadCount } from "@/lib/services/notifications";
import { findSchoolIdForUser } from "@/lib/services/school-overview";
import { PageContainer } from "@/components/shell/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { LinkTabs } from "@/components/ui/link-tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { BookingRow } from "@/components/school/booking-row";
import { SchoolNotifications } from "@/components/school/school-notifications";
import { groupBookings, type BookingTab } from "@/components/school/booking-groups";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations("SchoolBookingsPage");
  return { title: t("title") };
}

const TAB_HREF: Record<BookingTab, string> = {
  pending: "/school/bookings",
  upcoming: "/school/bookings?tab=upcoming",
  history: "/school/bookings?tab=history",
};

const EMPTY_ICON = { pending: Clock3, upcoming: CalendarCheck, history: History } as const;

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
  const tab: BookingTab = tabParam === "upcoming" || tabParam === "history" ? tabParam : "pending";

  const [bookings, notifications, unread, t] = await Promise.all([
    listSchoolBookings(session.user.id),
    listNotifications(session.user.id),
    unreadCount(session.user.id),
    getTranslations("SchoolBookingsPage"),
  ]);
  const groups = groupBookings(bookings);
  const shown = groups[tab];

  const count = (n: number) =>
    n > 0 ? (
      <Badge variant="neutral" className="tabular-nums">
        {n}
      </Badge>
    ) : undefined;

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("description")} />

      <div className="flex flex-col gap-section lg:grid lg:grid-cols-3 lg:items-start lg:gap-x-8">
        <section aria-labelledby="reservas-lista" className="flex flex-col gap-4 lg:col-span-2">
          <h2 id="reservas-lista" className="sr-only">
            {t(`tabs.${tab}`)}
          </h2>
          <LinkTabs
            label={t("tabs.label")}
            value={tab}
            items={[
              { value: "pending", href: TAB_HREF.pending, label: t("tabs.pending"), badge: count(groups.pending.length) },
              { value: "upcoming", href: TAB_HREF.upcoming, label: t("tabs.upcoming") },
              { value: "history", href: TAB_HREF.history, label: t("tabs.history") },
            ]}
          />
          {shown.length > 0 ? (
            <ul role="list" className="flex flex-col gap-stack">
              {shown.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
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
                  <Link href="/school/discovery" className={buttonVariants({ variant: "outline" })}>
                    {t("empty.action")}
                  </Link>
                )
              }
            />
          )}
        </section>

        <SchoolNotifications
          notifications={notifications}
          unread={unread}
          // On phones, news comes first while there is something unread.
          className={cn("lg:col-start-3 lg:row-start-1", unread > 0 && "max-lg:order-first")}
        />
      </div>
    </PageContainer>
  );
}
