"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { markAllNotificationsReadAction } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { byId, refocusWhenRemoved } from "@/components/shell/focus";

/**
 * "Marcar tudo como lido" — the quiet text action in a Notificações
 * heading (NotificationsSection). Then router.refresh(), so the unread
 * dots and the nav's "new activity" dot clear, and a toast that reuses the
 * verb ("Tudo marcado como lido."). The button only exists while something
 * is unread, so once the refresh removes it focus moves to `focusAfter`
 * (the section, tabIndex -1) instead of falling back to <body>.
 */
export function MarkAllReadButton({ focusAfter }: { focusAfter: string }) {
  const t = useTranslations("UI.notifications");
  const router = useRouter();
  const ref = React.useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [refreshing, startTransition] = React.useTransition();

  async function markAll() {
    setBusy(true);
    const res = await markAllNotificationsReadAction();
    setBusy(false);
    if (!res.ok) {
      // Nothing to correct in a form: the server's sentence, as a toast.
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
