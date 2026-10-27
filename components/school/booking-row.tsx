import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { ItemRow } from "@/components/ui/list-row";
import { StatusBadge, bookingStatusIcon, bookingStatusTone } from "@/components/brand/status-badge";
import { CancelBookingButton } from "@/components/school/cancel-booking-button";
import { formatDayTimeRange, formatRelativeDay } from "@/lib/format";
import type { BookingView } from "@/lib/services/booking";

/**
 * One booking for the school: instructor avatar + name, "Amanhã ·
 * 9:00–11:00", status, who asked for it, the notes, and the instructor's
 * reason when declined. `cancellable` adds "Cancelar aula" / "Cancelar
 * pedido" (only for requested/accepted bookings that haven't happened).
 */
export function BookingRow({
  booking: b,
  cancellable = false,
  focusAfter = "reservas-lista",
  showStatus = true,
  showRequester = true,
}: {
  booking: BookingView;
  cancellable?: boolean;
  /** Where focus goes after this row is cancelled (an id, tabIndex -1). */
  focusAfter?: string;
  showStatus?: boolean;
  showRequester?: boolean;
}) {
  const t = useTranslations("SchoolBookingsPage");
  const canCancel = cancellable && (b.status === "requested" || b.status === "accepted");
  const hasDetails = b.notes || b.declineReason || showRequester;

  return (
    <li>
      <ItemRow
        leading={<Avatar name={b.instructorName} />}
        title={b.instructorName}
        description={formatDayTimeRange(b.bookingDate, b.startTime, b.endTime)}
        status={
          showStatus ? (
            <StatusBadge tone={bookingStatusTone(b.status)} icon={bookingStatusIcon(b.status)}>
              {t(`status.${b.status}`)}
            </StatusBadge>
          ) : undefined
        }
        actions={
          canCancel ? (
            <CancelBookingButton
              bookingId={b.id}
              kind={b.status === "accepted" ? "lesson" : "request"}
              day={formatRelativeDay(b.bookingDate, { lowercase: true })}
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
              {b.notes && <span className="line-clamp-3">{b.notes}</span>}
              {showRequester && <span>{t("requestedBy", { name: b.requestedByName })}</span>}
            </>
          ) : undefined
        }
      />
    </li>
  );
}
