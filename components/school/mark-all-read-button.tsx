"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { markAllNotificationsReadAction } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

/**
 * "Marcar tudo como lido" — then router.refresh() so the unread dots and
 * the tab-bar count clear (FOUNDATION: the layout re-reads the count).
 */
export function MarkAllReadButton() {
  const t = useTranslations("SchoolBookingsPage.notifications");
  const router = useRouter();
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
    startTransition(() => router.refresh());
  }

  return (
    <Button
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
