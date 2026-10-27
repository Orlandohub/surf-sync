import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Bell, CalendarCheck, Clock3, History } from "lucide-react";
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
import { bookingTab, groupBookings, type BookingTab } from "@/components/school/booking-groups";
import { lisbonToday } from "@/lib/format";
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
  const today = lisbonToday();
  const groups = groupBookings(bookings, today);
  const shown = groups[tab];
  // Each notification opens the tab its booking is in now.
  const notificationTabs = Object.fromEntries(bookings.map((b) => [b.id, bookingTab(b, today)]));

  // The number is read with its noun: "Pendentes, 2 pedidos".
  const count = (n: number) =>
    n > 0 ? (
      <Badge variant="neutral" className="tabular-nums">
        <span aria-hidden>{n}</span>
        <span className="sr-only">{t("tabs.pendingCount", { count: n })}</span>
      </Badge>
    ) : undefined;

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={t("description")}
        // Phones: notifications sit after the bookings, always (a stable
        // order), so the header carries a bell that jumps to them.
        action={
          <a
            href="#notificacoes"
            aria-label={t("notifications.jump", { count: unread })}
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative lg:hidden")}
          >
            <Bell aria-hidden strokeWidth={1.75} />
            {unread > 0 && (
              <Badge variant="count" aria-hidden className="absolute -top-0.5 -right-0.5">
                {unread}
              </Badge>
            )}
          </a>
        }
      />

      <div className="flex flex-col gap-section lg:grid lg:grid-cols-3 lg:items-start lg:gap-x-8">
        <section aria-labelledby="reservas-lista" className="flex flex-col gap-4 lg:col-span-2">
          {/* tabIndex: where focus goes when a cancelled row leaves the list. */}
          <h2 id="reservas-lista" tabIndex={-1} className="sr-only">
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
          tabs={notificationTabs}
          tabHref={TAB_HREF}
          className="lg:col-start-3 lg:row-start-1"
        />
      </div>
    </PageContainer>
  );
}
