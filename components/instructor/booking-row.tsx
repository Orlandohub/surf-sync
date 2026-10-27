import { useTranslations } from "next-intl";
import { CalendarClock } from "lucide-react";
import { ItemRow } from "@/components/ui/list-row";
import {
  StatusBadge,
  bookingStatusIcon,
  bookingStatusTone,
} from "@/components/brand/status-badge";
import { DateTile } from "@/components/instructor/date-tile";
import {
  AcceptAction,
  CancelAction,
  DeclineAction,
} from "@/components/instructor/booking-actions";
import {
  displayStatus,
  type InstructorBooking,
} from "@/components/instructor/booking-groups";
import { formatDayTimeRange, type IsoDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * One booking in the instructor's lists (Início and Aulas), on ItemRow:
 * date tile · school · "Sábado · 10:00–12:00" · status · the school's note.
 * A server component; only the actions (booking-actions.tsx) run on the
 * client.
 *
 * - `request`: Recusar (outline, opens a confirmation with an optional
 *   reason) · Aceitar (tonal). Never filled: a list can hold several
 *   requests and the view keeps one filled primary at most.
 * - `upcoming`: Cancelar aula (outline, compact, confirmation).
 * - `history`: read-only, except a request nobody answered whose day has
 *   passed ("Sem resposta"), which can still be declined.
 * - `actions={false}`: read-only (Início's lesson previews).
 *
 * The note is the school's request (meeting point, group, languages): it
 * is shown in full wherever the instructor decides. `clampNote` keeps
 * Início's read-only previews short; the full text is one tap away in Aulas.
 */
export function InstructorBookingRow({
  booking,
  today,
  view,
  actions = true,
  clampNote = false,
}: {
  booking: InstructorBooking;
  today: IsoDate;
  view: "request" | "upcoming" | "history";
  actions?: boolean;
  clampNote?: boolean;
}) {
  const t = useTranslations("InstructorBookingRow");
  const status = displayStatus(booking, today);
  const when = formatDayTimeRange(booking.bookingDate, booking.startTime, booking.endTime);

  const note =
    view === "request"
      ? booking.notes
        ? t("noteFrom", { name: booking.requestedByName, note: booking.notes })
        : t("requestedBy", { name: booking.requestedByName })
      : booking.status === "declined" && booking.declineReason
        ? t("declineReason", { reason: booking.declineReason })
        : booking.notes;

  const rowActions = !actions ? undefined : view === "request" ? (
    <>
      <DeclineAction booking={booking} when={when} />
      <AcceptAction booking={booking} when={when} />
    </>
  ) : view === "upcoming" ? (
    <CancelAction booking={booking} when={when} />
  ) : status === "expired" ? (
    <div className="flex justify-end">
      <DeclineAction booking={booking} when={when} list="history" />
    </div>
  ) : undefined;

  return (
    <ItemRow
      leading={<DateTile date={booking.bookingDate} muted={view === "history"} />}
      title={booking.schoolName}
      description={when}
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
      actions={rowActions}
    >
      {note && (
        <span
          className={cn(
            "basis-full text-meta text-muted-foreground",
            clampNote ? "line-clamp-2" : "break-words whitespace-pre-line",
          )}
        >
          {note}
        </span>
      )}
    </ItemRow>
  );
}
