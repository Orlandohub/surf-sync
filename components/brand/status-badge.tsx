/**
 * DS §07.3 Badge — dot + label, outline-on-tint, never solid fills.
 * Semantic statuses map to booking/profile states:
 * success = accepted/active · warning = requested/pending ·
 * danger = declined · info = confirmed/brand.
 */
const COLORS = {
  success: "var(--ss-success)",
  warning: "var(--ss-warning)",
  danger: "var(--ss-danger)",
  info: "var(--ss-teal-500)",
} as const;

export function StatusBadge({
  tone,
  children,
}: {
  tone: keyof typeof COLORS;
  children: React.ReactNode;
}) {
  return (
    <span className="status-badge" style={{ ["--badge-color" as string]: COLORS[tone] }}>
      <span className="status-dot" />
      {children}
    </span>
  );
}
