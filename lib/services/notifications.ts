import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { notification } from "@/lib/db/schema/app";
import { sendBookingNotificationEmail } from "@/lib/email/send-booking-notification";

/**
 * Notifications service (Epic 8).
 *
 * Every booking event creates an in-app notification row (source of
 * truth for the bell/list) and dispatches an email via the transport
 * seam. Email failure must never break the booking transaction — the
 * in-app row is always written first.
 */

export type BookingEventType =
  | "booking_requested"
  | "booking_accepted"
  | "booking_declined"
  | "booking_cancelled";

export type NotificationPayload = {
  bookingId: string;
  instructorName: string;
  schoolName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  byUserName?: string;
  declineReason?: string;
};

export async function notifyBookingEvent(
  recipientUserId: string,
  recipientEmail: string,
  type: BookingEventType,
  payload: NotificationPayload,
): Promise<void> {
  await db.insert(notification).values({
    userId: recipientUserId,
    type,
    payload: payload as unknown as Record<string, unknown>,
  });

  // Best-effort email; in-app row already persisted. (SUR-29 tracks the
  // queue migration for sends.)
  try {
    await sendBookingNotificationEmail({ to: recipientEmail, type, payload });
  } catch {
    // Deliberate swallow: a booking must not fail because an email didn't
    // go out. Surfaced via logging when Sentry lands (SUR-28).
  }
}

export type NotificationItem = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
};

export async function listNotifications(
  userId: string,
): Promise<NotificationItem[]> {
  return db
    .select()
    .from(notification)
    .where(eq(notification.userId, userId))
    .orderBy(desc(notification.createdAt))
    .limit(50);
}

export async function unreadCount(userId: string): Promise<number> {
  const rows = await db
    .select({ id: notification.id })
    .from(notification)
    .where(and(eq(notification.userId, userId), isNull(notification.readAt)));
  return rows.length;
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(
      and(eq(notification.id, notificationId), eq(notification.userId, userId)),
    );
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(and(eq(notification.userId, userId), isNull(notification.readAt)));
}
