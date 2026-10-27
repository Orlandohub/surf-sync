import { Ban, Check, CheckCheck, Clock3, X, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * surfsync DS — status badge on the soft Badge variants (COMPONENTS.md
 * "Badge"). Status colours carry state only and always pair with an
 * explicit word — colour never carries meaning alone (DESIGN.md C7).
 *
 *   <StatusBadge tone="success">Confirmada</StatusBadge>
 *   <StatusBadge tone={bookingStatusTone(b.status)} icon={bookingStatusIcon(b.status)}>
 *     {t(`status.${b.status}`)}
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
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Badge variant={TONE_TO_VARIANT[tone]}>
      {Icon && <Icon aria-hidden strokeWidth={1.75} />}
      {children}
    </Badge>
  );
}

export type BookingStatus = "requested" | "accepted" | "declined" | "cancelled" | "completed";

/**
 * One mapping for booking states across instructor and school screens:
 * waiting → warning, confirmed → success, declined/cancelled → danger,
 * completed (history, nothing to do) → neutral.
 */
const BOOKING_TONE: Record<BookingStatus, StatusTone> = {
  requested: "warning",
  accepted: "success",
  declined: "danger",
  cancelled: "danger",
  completed: "neutral",
};

const BOOKING_ICON: Record<BookingStatus, LucideIcon> = {
  requested: Clock3,
  accepted: Check,
  declined: X,
  cancelled: Ban,
  completed: CheckCheck,
};

export function bookingStatusTone(status: BookingStatus): StatusTone {
  return BOOKING_TONE[status];
}

export function bookingStatusIcon(status: BookingStatus): LucideIcon {
  return BOOKING_ICON[status];
}
