"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cancelBookingAction } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { byId, refocusWhenRemoved } from "@/components/shell/focus";
import { formatTime } from "@/lib/format";

/**
 * "Cancelar aula" / "Cancelar pedido" on a booking row → ConfirmDialog
 * ("Cancelar a aula de sábado?", destructive "Cancelar aula", dismiss
 * "Manter aula") → the existing cancelBookingAction. A refusal from the
 * server stays in the dialog, inline. The day and time are in the
 * button's name ("Cancelar pedido a Ana Marques, Sábado · 10:00–12:00",
 * the pattern of the instructor's row actions) and in the dialog, so two
 * requests on the same day can't be confused.
 * After a cancel the row leaves the tab (or loses this button), so focus
 * moves to `focusAfter`, the list's heading.
 */
export function CancelBookingButton({
  bookingId,
  kind,
  day,
  when,
  startTime,
  endTime,
  instructorName,
  focusAfter,
}: {
  bookingId: string;
  /** An accepted lesson or a request still waiting for an answer. */
  kind: "lesson" | "request";
  /** Mid-sentence day: "amanhã", "sábado", "3 de novembro". */
  day: string;
  /** The row's meta line: "Sábado · 10:00–12:00". */
  when: string;
  /** DB times, "10:00:00". */
  startTime: string;
  endTime: string;
  instructorName: string;
  /** Id of the element (tabIndex -1) that takes focus after a cancel. */
  focusAfter: string;
}) {
  const t = useTranslations("SchoolBookingsPage.cancel");
  const router = useRouter();
  const [, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const lesson = kind === "lesson";

  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="outline"
          size="sm"
          data-cancel-booking={bookingId}
          aria-label={t(lesson ? "lessonAria" : "requestAria", { instructor: instructorName, when })}
        >
          {lesson ? t("lesson") : t("request")}
        </Button>
      }
      title={lesson ? t("lessonTitle", { day }) : t("requestTitle", { day })}
      description={t("description", {
        instructor: instructorName,
        start: formatTime(startTime),
        end: formatTime(endTime),
      })}
      cancelLabel={lesson ? t("keepLesson") : t("keepRequest")}
      confirmLabel={lesson ? t("lesson") : t("request")}
      pendingLabel={t("pending")}
      tone="destructive"
      error={error}
      onOpenChange={(open) => {
        if (open || !error) return;
        // The server refused (e.g. the instructor cancelled meanwhile):
        // show the booking's real state once the dialog closes.
        setError(null);
        startTransition(() => router.refresh());
      }}
      onConfirm={async () => {
        const res = await cancelBookingAction(bookingId);
        if (!res.ok) {
          setError(res.error);
          return false;
        }
        toast(lesson ? t("lessonDone") : t("requestDone"));
        refocusWhenRemoved(
          document.querySelector(`[data-cancel-booking="${bookingId}"]`),
          byId(focusAfter),
        );
        startTransition(() => router.refresh());
      }}
    />
  );
}
