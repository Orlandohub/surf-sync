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
  showStatus = true,
  showRequester = true,
}: {
  booking: BookingView;
  cancellable?: boolean;
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
              instructorName={b.instructorName}
            />
          ) : undefined
        }
      >
        {hasDetails && (
          <span className="flex basis-full flex-col gap-1 pt-0.5">
            {b.declineReason && (
              <span className="text-meta text-foreground">{t("declineReason", { reason: b.declineReason })}</span>
            )}
            {b.notes && <span className="line-clamp-3 text-meta text-muted-foreground">{b.notes}</span>}
            {showRequester && (
              <span className="text-meta text-muted-foreground">
                {t("requestedBy", { name: b.requestedByName })}
              </span>
            )}
          </span>
        )}
      </ItemRow>
    </li>
  );
}
