"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cancelBookingAction } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

/**
 * "Cancelar aula" / "Cancelar pedido" on a booking row → ConfirmDialog
 * ("Cancelar a aula de sábado?", destructive "Cancelar aula", dismiss
 * "Manter aula") → the existing cancelBookingAction. A refusal from the
 * server stays in the dialog, inline.
 */
export function CancelBookingButton({
  bookingId,
  kind,
  day,
  instructorName,
}: {
  bookingId: string;
  /** An accepted lesson or a request still waiting for an answer. */
  kind: "lesson" | "request";
  /** Mid-sentence day: "amanhã", "sábado", "3 de novembro". */
  day: string;
  instructorName: string;
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
          aria-label={t(lesson ? "lessonAria" : "requestAria", { instructor: instructorName, day })}
        >
          {lesson ? t("lesson") : t("request")}
        </Button>
      }
      title={lesson ? t("lessonTitle", { day }) : t("requestTitle", { day })}
      description={t("description", { instructor: instructorName })}
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
        startTransition(() => router.refresh());
      }}
    />
  );
}
