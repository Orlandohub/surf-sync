"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondBookingAction, cancelBookingAction, markAllNotificationsReadAction } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/brand/status-badge";
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

  function statusTone(status: string): "success" | "warning" | "danger" | "info" {
    if (status === "accepted" || status === "completed") return "success";
    if (status === "requested") return "warning";
    if (status === "declined") return "danger";
    return "info";
  }

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
        <span className="text-meta text-muted-foreground">{t("eyebrow")}</span>
        <h1 className="text-headline">{t("title")}</h1>
        <p className="text-meta text-muted-foreground">{t("subtitle")}</p>
      </div>

      {notifications.length > 0 && (
        <Card className="w-full max-w-3xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-body-lg">{t("notifications.title")}</CardTitle>
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
                className="flex items-baseline gap-2 rounded-control border p-3 text-body"
              >
                {!n.readAt && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                <p className={n.readAt ? "text-muted-foreground" : "text-foreground"}>
                  {t(`notificationTypes.${n.type}`, {
                    instructor: String((n.payload as Record<string, unknown>).instructorName ?? ""),
                    school: String((n.payload as Record<string, unknown>).schoolName ?? ""),
                    date: String((n.payload as Record<string, unknown>).bookingDate ?? ""),
                  })}
                </p>
                <span className="ml-auto shrink-0 text-caption tabular-nums text-muted-foreground">
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
                  <CardTitle className="text-label">
                    {b.schoolName} · {b.bookingDate} ·{" "}
                    <span className="tabular-nums">
                      {b.startTime.slice(0, 5)}–{b.endTime.slice(0, 5)}
                    </span>
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={statusTone(b.status)}>
                      {t(`status.${b.status}`)}
                    </StatusBadge>
                    {b.status === "requested" && (
                      <span className="text-caption text-muted-foreground">
                        {t("requestedBy", { name: b.requestedByName })}
                      </span>
                    )}
                  </div>
                  {b.notes && (
                    <p className="text-meta text-muted-foreground">{b.notes}</p>
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
                <div className="mt-3 flex flex-col gap-2 rounded-control border border-border p-3">
                  <label className="text-meta font-medium" htmlFor={`reason-${b.id}`}>{t("declineReason")}</label>
                  <input
                    id={`reason-${b.id}`}
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    maxLength={500}
                    className="h-12 rounded-control border border-input bg-card px-4 text-body-lg outline-none placeholder:text-placeholder focus-visible:border-ring"
                  />
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" disabled={pending} onClick={() => handleRespond(b.id, false)}>
                      {t("confirmDecline")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setDeclining(null); setDeclineReason(""); }}>
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
            <CardContent className="py-10 text-center text-meta text-muted-foreground">
              {t("empty")}
            </CardContent>
          </Card>
        )}
        {error && (
          <p className="text-body text-destructive" role="alert">{error}</p>
        )}
      </div>
    </main>
  );
}
