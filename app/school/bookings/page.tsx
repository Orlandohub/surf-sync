import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { listSchoolBookings } from "@/lib/services/booking";
import { listNotifications, unreadCount } from "@/lib/services/notifications";
import { SchoolBookings } from "@/components/school/school-bookings";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("SchoolBookingsPage");
  return { title: t("title") };
}

export default async function SchoolBookingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  if (session.user.type !== "school_staff") redirect("/");

  const [bookings, notifications, unread] = await Promise.all([
    listSchoolBookings(session.user.id),
    listNotifications(session.user.id),
    unreadCount(session.user.id),
  ]);

  return (
    <SchoolBookings
      bookings={bookings}
      notifications={notifications}
      unreadCount={unread}
    />
  );
}
