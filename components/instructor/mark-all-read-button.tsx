"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { markAllNotificationsReadAction } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

/**
 * "Marcar tudo como lido" — a quiet text action in the Notificações
 * heading. Refreshes the route so the dots and the nav's unread badge clear.
 */
export function MarkAllReadButton() {
  const t = useTranslations("InstructorBookingsPage.notifications");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [refreshing, startTransition] = useTransition();

  async function markAll() {
    setBusy(true);
    const res = await markAllNotificationsReadAction();
    setBusy(false);
    if (!res.ok) {
      toast.error(t("markAllFailed"));
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <Button
      variant="link"
      size="sm"
      pending={busy || refreshing}
      pendingLabel={t("marking")}
      onClick={markAll}
    >
      {t("markAll")}
    </Button>
  );
}
