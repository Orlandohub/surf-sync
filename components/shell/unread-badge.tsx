"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

/**
 * Unread-notifications count on a nav item (COMPONENTS.md "Bottom tab
 * bar": `Badge variant="count"`). Shows "9+" past nine; screen readers
 * hear the exact number after the item's label.
 */
export function UnreadBadge({ count, className }: { count: number; className?: string }) {
  const t = useTranslations("Nav");
  return (
    <>
      <Badge variant="count" aria-hidden className={className}>
        {count > 9 ? "9+" : count}
      </Badge>
      <span className="sr-only"> {t("unread", { count })}</span>
    </>
  );
}
