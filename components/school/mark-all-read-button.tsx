"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { markAllNotificationsReadAction } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { byId, refocusWhenRemoved } from "@/components/school/focus";

/**
 * "Marcar tudo como lido" — then router.refresh() so the unread dots and
 * the tab-bar count clear (FOUNDATION: the layout re-reads the count).
 * The button only exists while something is unread, so once the refresh
 * removes it, focus moves to `focusAfter` (the notifications section).
 */
export function MarkAllReadButton({ focusAfter }: { focusAfter: string }) {
  const t = useTranslations("SchoolBookingsPage.notifications");
  const router = useRouter();
  const ref = React.useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [refreshing, startTransition] = React.useTransition();

  async function markAll() {
    setBusy(true);
    const res = await markAllNotificationsReadAction();
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast(t("markedAll"));
    refocusWhenRemoved(ref.current, byId(focusAfter));
    startTransition(() => router.refresh());
  }

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      className="text-primary hover:text-primary"
      pending={busy || refreshing}
      pendingLabel={t("markingAll")}
      onClick={markAll}
    >
      {t("markAll")}
    </Button>
  );
}
