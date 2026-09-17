import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { listInstructorBookings } from "@/lib/services/booking";
import { listNotifications, unreadCount } from "@/lib/services/notifications";
import { InstructorBookings } from "@/components/instructor/instructor-bookings";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("InstructorBookingsPage");
  return { title: t("title") };
}

export default async function InstructorBookingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  if (session.user.type !== "instructor") redirect("/");

  const [bookings, notifications, unread] = await Promise.all([
    listInstructorBookings(session.user.id),
    listNotifications(session.user.id),
    unreadCount(session.user.id),
  ]);

  return (
    <InstructorBookings
      bookings={bookings}
      notifications={notifications}
      unreadCount={unread}
    />
  );
}
