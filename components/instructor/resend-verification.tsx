"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";

/**
 * "Reenviar email" for the onboarding checklist's email step: sends a new
 * verification link (same call as sign-up) and says where it went. The
 * status line is always mounted so the confirmation is announced.
 */
export function ResendVerification({ email }: { email: string }) {
  const t = useTranslations("InstructorHomePage.onboarding.resend");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function resend() {
    setState("sending");
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/verify-email",
      });
      if (error) console.error(error);
      setState(error ? "error" : "sent");
    } catch (err) {
      console.error(err);
      setState("error");
    }
  }

  return (
    <div className="mt-2 flex flex-col items-start">
      <Button
        variant="outline"
        size="sm"
        pending={state === "sending"}
        pendingLabel={t("sending")}
        onClick={resend}
      >
        {t("action")}
      </Button>
      <p role="status" className="text-meta text-muted-foreground">
        {state === "sent" && <span className="mt-1.5 block">{t("sent", { email })}</span>}
      </p>
      {state === "error" && <FieldError className="mt-1.5">{t("error")}</FieldError>}
    </div>
  );
}
