import { Ban, CalendarClock, Check, CheckCheck, Clock3, X, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { IconComponent } from "@/components/brand/icons";
import type { BookingDisplayStatus } from "@/lib/booking-view";

/**
 * surfsync DS — status badge on the soft Badge variants (COMPONENTS.md
 * "Badge"). Status colours carry state only and always pair with an
 * explicit word — colour never carries meaning alone (DESIGN.md C7).
 *
 *   <StatusBadge tone="success">Confirmada</StatusBadge>
 *   const status = displayStatus(b, today); // lib/booking-view
 *   <StatusBadge tone={bookingStatusTone(status)} icon={bookingStatusIcon(status)}>
 *     {t(`status.${status}`)}
 *   </StatusBadge>
 */
const TONE_TO_VARIANT = {
  success: "success",
  warning: "warning",
  danger: "destructive",
  neutral: "neutral",
  /** Kept for existing callers: the soft teal default. */
  info: "default",
} as const;

export type StatusTone = keyof typeof TONE_TO_VARIANT;

export function StatusBadge({
  tone,
  icon: Icon,
  children,
}: {
  tone: StatusTone;
  /** Optional leading glyph (14px) to make the state scannable. */
  icon?: IconComponent;
  children: React.ReactNode;
}) {
  return (
    <Badge variant={TONE_TO_VARIANT[tone]}>
      {Icon && <Icon aria-hidden strokeWidth={1.75} />}
      {children}
    </Badge>
  );
}

/**
 * One mapping for booking states across instructor and school screens
 * (the display status from lib/booking-view): waiting → warning,
 * confirmed → success, declined/cancelled → danger, completed (history,
 * nothing to do) → neutral, and a request whose day passed unanswered
 * ("Sem resposta") → neutral with a clock calendar, never "pending".
 */
const BOOKING_TONE: Record<BookingDisplayStatus, StatusTone> = {
  requested: "warning",
  accepted: "success",
  declined: "danger",
  cancelled: "danger",
  completed: "neutral",
  expired: "neutral",
};

const BOOKING_ICON: Record<BookingDisplayStatus, LucideIcon> = {
  requested: Clock3,
  accepted: Check,
  declined: X,
  cancelled: Ban,
  completed: CheckCheck,
  expired: CalendarClock,
};

export function bookingStatusTone(status: BookingDisplayStatus): StatusTone {
  return BOOKING_TONE[status];
}

export function bookingStatusIcon(status: BookingDisplayStatus): LucideIcon {
  return BOOKING_ICON[status];
}
