import { Badge } from "@/components/ui/badge";

/**
 * surfsync DS — status badge on the new Badge variants (COMPONENTS.md).
 * Tone kept for callers; maps onto soft badge variants. Status always
 * pairs with an explicit word — colour never carries meaning alone.
 */
const TONE_TO_VARIANT = {
  success: "success",
  warning: "warning",
  danger: "destructive",
  info: "default",
} as const;

export function StatusBadge({
  tone,
  children,
}: {
  tone: keyof typeof TONE_TO_VARIANT;
  children: React.ReactNode;
}) {
  return <Badge variant={TONE_TO_VARIANT[tone]}>{children}</Badge>;
}
