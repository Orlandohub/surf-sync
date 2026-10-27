"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  ResendStatus,
  useResendVerification,
  type ResendStart,
} from "@/components/auth/resend-verification";
import { cn } from "@/lib/utils";

/**
 * "Reenviar email" for the onboarding checklist's email step: sends a new
 * confirmation link and says where it went. Same budget and feedback as
 * the auth screens (useResendVerification): a 60 s countdown after each
 * send, and the server's refusals — an email sent from elsewhere less than
 * a minute ago, or the daily cap — shown as such. The "sent" line is a
 * polite live region, so the confirmation is announced. Pass `start`
 * (resendStartFor(email) on the server) to begin from what was already
 * sent; without it the countdown starts at the first refusal.
 */
export function ResendVerification({ email, start }: { email: string; start?: ResendStart }) {
  const t = useTranslations("InstructorHomePage.onboarding.resend");
  const state = useResendVerification(email, start);
  const generic = state.error === "generic";

  return (
    <div className="mt-2 flex flex-col items-start gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={state.send}
        disabled={state.blocked}
        focusableWhenDisabled
        pending={state.pending}
        pendingLabel={t("sending")}
        className={cn(state.blocked && !state.pending && "cursor-not-allowed opacity-40")}
      >
        {t("action")}
      </Button>
      {generic ? (
        <FieldError>{t("error")}</FieldError>
      ) : (
        <ResendStatus state={state} sent={t("sent", { email })} />
      )}
    </div>
  );
}
