"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { respondBookingAction, cancelBookingAction } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import type { InstructorBooking } from "@/components/instructor/booking-groups";
import { formatRelativeDay } from "@/lib/format";

/**
 * The in-place actions of an instructor booking row (the row itself is a
 * server component). Every action names its booking for screen readers
 * ("Aceitar pedido de Onda Norte, Sábado · 10:00–12:00"), since a list
 * holds several identical buttons. `when` is the row's meta line, computed
 * on the server so it matches the visible text.
 */
type ActionProps = { booking: InstructorBooking; when: string };

/**
 * Re-renders the page with fresh data. On Aulas without an explicit tab the
 * default tab depends on the data (Pedidos while there are requests), so
 * the current tab is pinned in the URL first: answering the last request
 * keeps you on Pedidos instead of jumping to Próximas.
 */
function useRefresh(tab: "requests" | "upcoming" | "history") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [refreshing, startTransition] = useTransition();
  const refresh = () =>
    startTransition(() => {
      if (pathname === "/instructor/bookings" && !searchParams.has("tab")) {
        router.replace(`/instructor/bookings?tab=${tab}`, { scroll: false });
      } else {
        router.refresh();
      }
    });
  return { refreshing, refresh };
}

type FocusPlan = { next: Element | null; section: Element | null };

/**
 * An answered request (or cancelled lesson) leaves its list, taking the
 * focused button with it. Before that happens, `plan()` notes where focus
 * should go; when this action unmounts with focus lost to <body>, it moves
 * to the next row's first control, else the section's first heading or
 * current tab, else the page content. Keyboard and screen-reader users
 * keep their place.
 */
function useFocusAfterRemoval() {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const focusPlan = useRef<FocusPlan | null>(null);

  function plan() {
    const row = anchorRef.current?.closest("li") ?? null;
    focusPlan.current = {
      next: row?.nextElementSibling ?? row?.previousElementSibling ?? null,
      section: row?.closest("section") ?? null,
    };
  }

  useEffect(() => {
    const planned = focusPlan;
    return () => {
      const target = planned.current;
      if (!target) return;
      const active = document.activeElement;
      if (active && active !== document.body) return;
      const control = target.next?.isConnected
        ? target.next.querySelector<HTMLElement>("button:not(:disabled), a[href]")
        : null;
      const landmark = target.section?.isConnected
        ? target.section.querySelector<HTMLElement>("h2, h3, [aria-current=page]")
        : null;
      const next = control ?? landmark ?? document.getElementById("conteudo");
      if (!next) return;
      if (next === landmark && !next.matches("a[href]")) next.tabIndex = -1;
      next.focus();
    };
  }, []);

  return { anchorRef, plan };
}

/**
 * Recusar: outline, opens a confirmation with an optional reason. `list`
 * is where the row is: Pedidos, or Histórico for a request nobody answered
 * whose day has passed (declining it tells the school it's closed).
 */
export function DeclineAction({
  booking,
  when,
  list = "requests",
}: ActionProps & { list?: "requests" | "history" }) {
  const t = useTranslations("InstructorBookingRow");
  const { refresh } = useRefresh(list);
  const { anchorRef, plan } = useFocusAfterRemoval();
  const [reason, setReason] = useState("");
  const day = formatRelativeDay(booking.bookingDate, { lowercase: true });

  return (
    <ConfirmDialog
      trigger={
        <Button ref={anchorRef} variant="outline" size="sm">
          {t("decline.action")}
          <span className="sr-only"> {t("requestContext", { school: booking.schoolName, when })}</span>
        </Button>
      }
      title={t("decline.title", { day })}
      description={t("decline.description")}
      cancelLabel={t("decline.keep")}
      confirmLabel={t("decline.confirm")}
      pendingLabel={t("decline.pending")}
      tone="destructive"
      onOpenChange={(open) => {
        if (!open) setReason("");
      }}
      onConfirm={async () => {
        const res = await respondBookingAction(booking.id, false, reason.trim() || undefined);
        plan();
        // Answered or not, the list is refreshed: a request someone already
        // answered (the usual failure) leaves the list too.
        if (res.ok) toast(t("decline.done"));
        else toast.error(res.error);
        refresh();
      }}
    >
      <Field label={t("decline.reason")} helper={t("decline.reasonHelper")}>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          rows={3}
        />
      </Field>
    </ConfirmDialog>
  );
}

/** Aceitar: tonal, never filled (a list holds several requests). */
export function AcceptAction({ booking, when }: ActionProps) {
  const t = useTranslations("InstructorBookingRow");
  const { refreshing, refresh } = useRefresh("requests");
  const { anchorRef, plan } = useFocusAfterRemoval();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  async function accept() {
    setAccepting(true);
    const res = await respondBookingAction(booking.id, true);
    setAccepting(false);
    plan();
    if (!res.ok) {
      // Nothing to correct inline (e.g. the request was already answered).
      toast.error(res.error);
      refresh();
      return;
    }
    // Stays pending until the refreshed list moves the row to Próximas.
    setAccepted(true);
    toast(t("accept.done"));
    refresh();
  }

  return (
    <Button
      ref={anchorRef}
      variant="secondary"
      size="sm"
      pending={accepting || (accepted && refreshing)}
      pendingLabel={t("accept.pending")}
      onClick={accept}
    >
      <Check aria-hidden strokeWidth={1.75} />
      {t("accept.action")}
      <span className="sr-only"> {t("requestContext", { school: booking.schoolName, when })}</span>
    </Button>
  );
}

/**
 * Cancelar aula: outline, behind a confirmation. A lone action, so ItemRow
 * keeps it compact on phones: a list of lessons isn't a column of
 * full-width destructive buttons.
 */
export function CancelAction({ booking, when }: ActionProps) {
  const t = useTranslations("InstructorBookingRow");
  const { refresh } = useRefresh("upcoming");
  const { anchorRef, plan } = useFocusAfterRemoval();
  const day = formatRelativeDay(booking.bookingDate, { lowercase: true });

  return (
    <ConfirmDialog
      trigger={
        <Button ref={anchorRef} variant="outline" size="sm">
          {t("cancel.action")}
          <span className="sr-only"> {t("lessonContext", { school: booking.schoolName, when })}</span>
        </Button>
      }
      title={t("cancel.title", { day })}
      description={t("cancel.description")}
      cancelLabel={t("cancel.keep")}
      confirmLabel={t("cancel.confirm")}
      pendingLabel={t("cancel.pending")}
      tone="destructive"
      onConfirm={async () => {
        const res = await cancelBookingAction(booking.id);
        plan();
        if (res.ok) toast(t("cancel.done"));
        else toast.error(res.error);
        refresh();
      }}
    />
  );
}
