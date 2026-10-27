"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * "New activity" on a nav item: a small teal dot, no number. The pages
 * themselves show the counts (open requests on the Pedidos tab, unread
 * notifications by the list), so a second, different number in the nav
 * would read as a contradiction ("Aulas 3" beside "Pedidos 1"). Same dot
 * as an unread NotificationRow, 2px larger. Decorative: pair it with
 * <UnreadCount> after the item's label.
 */
export function UnreadDot({ className }: { className?: string }) {
  return (
    <span aria-hidden data-slot="unread-dot" className={cn("size-2 shrink-0 rounded-full bg-primary", className)} />
  );
}

/**
 * What the dot means, for screen readers: "(3 notificações por ler)".
 * Place it after the label so the link reads "Aulas (3 notificações por
 * ler)".
 */
export function UnreadCount({ count }: { count: number }) {
  const t = useTranslations("Nav");
  return <span className="sr-only"> {t("unread", { count })}</span>;
}
