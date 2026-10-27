"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarClock, Check } from "lucide-react";
import { respondBookingAction, cancelBookingAction } from "@/lib/actions/booking";
import { ItemRow } from "@/components/ui/list-row";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  StatusBadge,
  bookingStatusIcon,
  bookingStatusTone,
} from "@/components/brand/status-badge";
import { DateTile } from "@/components/instructor/date-tile";
import {
  displayStatus,
  type InstructorBooking,
} from "@/components/instructor/booking-groups";
import { formatDayTimeRange, formatRelativeDay, type IsoDate } from "@/lib/format";

/**
 * One booking in the instructor's lists (Início and Aulas), on ItemRow:
 * date tile · school · "Sábado · 10:00–12:00" · status · the school's note.
 *
 * - `request`: Recusar (outline, opens a confirmation with an optional
 *   reason) · Aceitar (tonal). Never filled: a list can hold several
 *   requests and the view keeps one filled primary at most.
 * - `upcoming`: Cancelar aula (outline, confirmation).
 * - `history` / `actions={false}`: read-only.
 */
export function InstructorBookingRow({
  booking,
  today,
  view,
  actions = true,
}: {
  booking: InstructorBooking;
  today: IsoDate;
  view: "request" | "upcoming" | "history";
  actions?: boolean;
}) {
  const t = useTranslations("InstructorBookingRow");
  const status = displayStatus(booking, today);
  const muted = view === "history";

  const note =
    view === "request"
      ? booking.notes
        ? t("noteFrom", { name: booking.requestedByName, note: booking.notes })
        : t("requestedBy", { name: booking.requestedByName })
      : booking.status === "declined" && booking.declineReason
        ? t("declineReason", { reason: booking.declineReason })
        : booking.notes;

  return (
    <ItemRow
      leading={<DateTile date={booking.bookingDate} muted={muted} />}
      title={booking.schoolName}
      description={formatDayTimeRange(booking.bookingDate, booking.startTime, booking.endTime)}
      status={
        status === "expired" ? (
          <StatusBadge tone="neutral" icon={CalendarClock}>
            {t("status.expired")}
          </StatusBadge>
        ) : (
          <StatusBadge tone={bookingStatusTone(status)} icon={bookingStatusIcon(status)}>
            {t(`status.${status}`)}
          </StatusBadge>
        )
      }
      actions={
        actions && view === "request" ? (
          <RequestActions booking={booking} />
        ) : actions && view === "upcoming" ? (
          <CancelAction booking={booking} />
        ) : undefined
      }
    >
      {note && (
        <span className="line-clamp-2 basis-full text-meta text-muted-foreground">{note}</span>
      )}
    </ItemRow>
  );
}

/**
 * Re-renders the page with fresh data. On Aulas without an explicit tab the
 * default tab depends on the data (Pedidos while there are requests), so
 * the current tab is pinned in the URL first: answering the last request
 * keeps you on Pedidos instead of jumping to Próximas.
 */
function useRefresh(tab: "requests" | "upcoming") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [refreshing, startTransition] = useTransition();
  const refresh = () =>
    startTransition(() => {
      if (pathname === "/instructor/bookings" && !searchParams.has("tab")) {
        router.replace(`/instructor/bookings?tab=${tab}`, { scroll: false });
      } else {
        router.refresh();
      }
    });
  return { refreshing, refresh };
}

function RequestActions({ booking }: { booking: InstructorBooking }) {
  const t = useTranslations("InstructorBookingRow");
  const { refreshing, refresh } = useRefresh("requests");
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const day = formatRelativeDay(booking.bookingDate, { lowercase: true });

  async function accept() {
    setAccepting(true);
    const res = await respondBookingAction(booking.id, true);
    setAccepting(false);
    if (!res.ok) {
      // Nothing to correct inline (e.g. the request was already answered).
      toast.error(res.error);
      refresh();
      return;
    }
    // Stays pending until the refreshed list moves the row to Próximas.
    setAccepted(true);
    toast(t("accept.done"));
    refresh();
  }

  return (
    <>
      <ConfirmDialog
        trigger={
          <Button variant="outline" size="sm" disabled={accepting || accepted}>
            {t("decline.action")}
          </Button>
        }
        title={t("decline.title", { day })}
        description={t("decline.description")}
        cancelLabel={t("decline.keep")}
        confirmLabel={t("decline.confirm")}
        pendingLabel={t("decline.pending")}
        tone="destructive"
        error={error}
        onOpenChange={(open) => {
          if (!open) {
            setError(null);
            setReason("");
          }
        }}
        onConfirm={async () => {
          const res = await respondBookingAction(booking.id, false, reason.trim() || undefined);
          if (!res.ok) {
            setError(res.error);
            return false;
          }
          toast(t("decline.done"));
          refresh();
        }}
      >
        <Field label={t("decline.reason")} helper={t("decline.reasonHelper")}>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
          />
        </Field>
      </ConfirmDialog>
      <Button
        variant="secondary"
        size="sm"
        pending={accepting || (accepted && refreshing)}
        pendingLabel={t("accept.pending")}
        onClick={accept}
      >
        <Check aria-hidden strokeWidth={1.75} />
        {t("accept.action")}
      </Button>
    </>
  );
}

function CancelAction({ booking }: { booking: InstructorBooking }) {
  const t = useTranslations("InstructorBookingRow");
  const { refresh } = useRefresh("upcoming");
  const [error, setError] = useState<string | null>(null);
  const day = formatRelativeDay(booking.bookingDate, { lowercase: true });

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm">
          {t("cancel.action")}
        </Button>
      }
      title={t("cancel.title", { day })}
      description={t("cancel.description")}
      cancelLabel={t("cancel.keep")}
      confirmLabel={t("cancel.confirm")}
      pendingLabel={t("cancel.pending")}
      tone="destructive"
      error={error}
      onOpenChange={(open) => {
        if (!open) setError(null);
      }}
      onConfirm={async () => {
        const res = await cancelBookingAction(booking.id);
        if (!res.ok) {
          setError(res.error);
          return false;
        }
        toast(t("cancel.done"));
        refresh();
      }}
    />
  );
}
