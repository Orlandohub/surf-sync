"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondBookingAction, cancelBookingAction, markAllNotificationsReadAction } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import type { BookingView } from "@/lib/services/booking";
import type { NotificationItem } from "@/lib/services/notifications";

export function InstructorBookings({
  bookings,
  notifications,
  unreadCount,
}: {
  bookings: BookingView[];
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const t = useTranslations("InstructorBookingsPage");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [declining, setDeclining] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  async function handleRespond(bookingId: string, accept: boolean) {
    setError(null);
    const res = await respondBookingAction(bookingId, accept, accept ? undefined : declineReason);
    if (!res.ok) { setError(res.error); return; }
    setDeclining(null);
    setDeclineReason("");
    startTransition(() => router.refresh());
  }

  async function handleCancel(bookingId: string) {
    setError(null);
    const res = await cancelBookingAction(bookingId);
    if (!res.ok) { setError(res.error); return; }
    startTransition(() => router.refresh());
  }

  async function handleReadAll() {
    await markAllNotificationsReadAction();
    startTransition(() => router.refresh());
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-4 py-10">
      <div className="flex w-full max-w-3xl flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {notifications.length > 0 && (
        <Card className="w-full max-w-3xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{t("notifications.title")}</CardTitle>
              <CardDescription>
                {t("notifications.unread", { count: unreadCount })}
              </CardDescription>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" disabled={pending} onClick={handleReadAll}>
                {t("notifications.markAll")}
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {notifications.slice(0, 8).map((n) => (
              <div
                key={n.id}
                className={`rounded-lg border p-3 text-sm ${n.readAt ? "border-border text-muted-foreground" : "border-primary/40 bg-primary/5"}`}
              >
                {t(`notificationTypes.${n.type}`, {
                  instructor: String((n.payload as Record<string, unknown>).instructorName ?? ""),
                  school: String((n.payload as Record<string, unknown>).schoolName ?? ""),
                  date: String((n.payload as Record<string, unknown>).bookingDate ?? ""),
                })}
                <span className="ml-2 text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString("pt-PT")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex w-full max-w-3xl flex-col gap-4">
        {bookings.map((b) => (
          <Card key={b.id}>
            <CardHeader>
              <div className="flex flex-row items-start justify-between">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base">
                    {b.schoolName} · {b.bookingDate} ·{" "}
                    {b.startTime.slice(0, 5)}–{b.endTime.slice(0, 5)}
                  </CardTitle>
                  <CardDescription>
                    {t(`status.${b.status}`)}
                    {b.status === "requested" && ` · ${t("requestedBy", { name: b.requestedByName })}`}
                  </CardDescription>
                  {b.notes && (
                    <p className="text-sm text-muted-foreground">{b.notes}</p>
                  )}
                </div>
                {b.status === "requested" && declining !== b.id && (
                  <div className="flex gap-2">
                    <Button size="sm" disabled={pending} onClick={() => handleRespond(b.id, true)}>
                      {t("accept")}
                    </Button>
                    <Button variant="outline" size="sm" disabled={pending} onClick={() => setDeclining(b.id)}>
                      {t("decline")}
                    </Button>
                  </div>
                )}
                {b.status === "accepted" && (
                  <Button variant="outline" size="sm" disabled={pending} onClick={() => handleCancel(b.id)}>
                    {t("cancel")}
                  </Button>
                )}
              </div>
              {declining === b.id && (
                <div className="mt-3 flex flex-col gap-2 rounded-lg border border-border p-3">
                  <label className="text-sm" htmlFor={`reason-${b.id}`}>{t("declineReason")}</label>
                  <input
                    id={`reason-${b.id}`}
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    maxLength={500}
                    className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" disabled={pending} onClick={() => handleRespond(b.id, false)}>
                      {t("confirmDecline")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setDeclining(null); setDeclineReason(""); }}>
                      {t("back")}
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>
        ))}
        {bookings.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {t("empty")}
            </CardContent>
          </Card>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        )}
      </div>
    </main>
  );
}
