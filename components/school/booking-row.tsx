import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { ItemRow } from "@/components/ui/list-row";
import { StatusBadge, bookingStatusIcon, bookingStatusTone } from "@/components/brand/status-badge";
import { CancelBookingButton } from "@/components/school/cancel-booking-button";
import { displayStatus } from "@/lib/booking-view";
import { formatDayTimeRange, formatRelativeDay, lisbonToday, type IsoDate } from "@/lib/format";
import type { BookingView } from "@/lib/services/booking";

/**
 * One booking for the school: instructor avatar + name, "Amanhã ·
 * 9:00–11:00", status, who asked for it, the notes, and the instructor's
 * reason when declined. `cancellable` adds "Cancelar aula" / "Cancelar
 * pedido" (only for requested/accepted bookings). A request nobody
 * answered whose day has passed reads "Sem resposta", as on the
 * instructor's side.
 *
 * The note (meeting point, group, kit, a phone number) is shown in full:
 * there is no booking page to read the rest on. `clampNote` keeps Início's
 * read-only previews short; the full text is one tap away in Reservas.
 */
export function BookingRow({
  booking: b,
  cancellable = false,
  focusAfter = "reservas-lista",
  showStatus = true,
  showRequester = true,
  clampNote = false,
  today = lisbonToday(),
}: {
  booking: BookingView;
  cancellable?: boolean;
  /** Where focus goes after this row is cancelled (an id, tabIndex -1). */
  focusAfter?: string;
  showStatus?: boolean;
  showRequester?: boolean;
  /** Início's previews: the note in two lines, line breaks folded. */
  clampNote?: boolean;
  /** Lisbon today, as the page grouped the bookings. */
  today?: IsoDate;
}) {
  const t = useTranslations("SchoolBookingsPage");
  const status = displayStatus(b, today);
  const when = formatDayTimeRange(b.bookingDate, b.startTime, b.endTime);
  const canCancel = cancellable && (b.status === "requested" || b.status === "accepted");
  const hasDetails = b.notes || b.declineReason || showRequester;

  return (
    <li>
      <ItemRow
        leading={<Avatar name={b.instructorName} />}
        title={b.instructorName}
        description={when}
        status={
          showStatus ? (
            <StatusBadge tone={bookingStatusTone(status)} icon={bookingStatusIcon(status)}>
              {t(`status.${status}`)}
            </StatusBadge>
          ) : undefined
        }
        actions={
          canCancel ? (
            <CancelBookingButton
              bookingId={b.id}
              kind={b.status === "accepted" ? "lesson" : "request"}
              day={formatRelativeDay(b.bookingDate, { lowercase: true })}
              when={when}
              startTime={b.startTime}
              endTime={b.endTime}
              instructorName={b.instructorName}
              focusAfter={focusAfter}
            />
          ) : undefined
        }
        note={
          hasDetails ? (
            <>
              {b.declineReason && (
                <span className="text-foreground">{t("declineReason", { reason: b.declineReason })}</span>
              )}
              {b.notes && (
                <span className={clampNote ? "line-clamp-2 whitespace-normal" : undefined}>{b.notes}</span>
              )}
              {showRequester && <span>{t("requestedBy", { name: b.requestedByName })}</span>}
            </>
          ) : undefined
        }
      />
    </li>
  );
}
