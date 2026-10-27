"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { resendErrorKey, type ResendErrorKey } from "@/components/auth/auth-helpers";

/** Matches the server's limiter (lib/services/verification.ts). */
const COOLDOWN_MS = 60_000;
const DAILY_MAX = 5;

type Status = { kind: "idle" } | { kind: "sent" } | { kind: "error"; key: ResendErrorKey };

/**
 * "Reenviar email" for the email-confirmation link, with rate-limit
 * feedback.
 *
 * Better Auth 1.6 swallows errors thrown by our sendVerificationEmail hook
 * (it logs them and answers 200), so the server's 1-per-minute and
 * 5-per-day limits never reach the client. The button therefore keeps its
 * own honest cooldown — 60 s after every send it knows of — and stops
 * after 5 sends in this session. Real 429s (Better Auth's own endpoint
 * limiter in production) are still mapped to PT-PT messages.
 *
 * `sentAt`: when the last email went out (e.g. right after sign-up), to
 * start in cooldown. `sentCount`: sends already made in this session.
 */
export function ResendVerification({
  email,
  sentAt,
  sentCount = 0,
  variant = "outline",
}: {
  email: string;
  sentAt?: number;
  sentCount?: number;
  variant?: "default" | "outline";
}) {
  const t = useTranslations("Auth.resend");
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState<Status>({ kind: "idle" });
  const [count, setCount] = React.useState(sentCount);
  const [readyAt, setReadyAt] = React.useState(sentAt ? sentAt + COOLDOWN_MS : 0);
  const [now, setNow] = React.useState(() => Date.now());

  const waiting = readyAt > now;
  const seconds = Math.max(0, Math.ceil((readyAt - now) / 1000));
  const exhausted = count >= DAILY_MAX;

  // Tick once a second while cooling down.
  React.useEffect(() => {
    if (!waiting) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [waiting]);

  async function resend() {
    setPending(true);
    setStatus({ kind: "idle" });
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/verify-email",
      });
      if (error) {
        const key = resendErrorKey(error);
        setStatus({ kind: "error", key });
        if (key === "wait") setReadyAt(Date.now() + COOLDOWN_MS);
        if (key === "daily") setCount(DAILY_MAX);
        return;
      }
      setStatus({ kind: "sent" });
      setCount((c) => c + 1);
      setReadyAt(Date.now() + COOLDOWN_MS);
      setNow(Date.now());
    } catch {
      setStatus({ kind: "error", key: "generic" });
    } finally {
      setPending(false);
    }
  }

  const done = status.kind === "error" && status.key === "alreadyVerified";

  return (
    <div data-slot="resend-verification" className="flex flex-col gap-3">
      <Button
        type="button"
        variant={variant}
        size="lg"
        onClick={resend}
        disabled={waiting || exhausted || done}
        pending={pending}
        pendingLabel={t("pending")}
      >
        {t("submit")}
      </Button>
      <div aria-live="polite" className="empty:-mt-3">
        {status.kind === "sent" && <p className="text-meta text-muted-foreground">{t("sent")}</p>}
      </div>
      {status.kind === "error" && <FieldError>{t(`errors.${status.key}`)}</FieldError>}
      {exhausted && status.kind !== "error" && <FieldError>{t("errors.daily")}</FieldError>}
      {waiting && !exhausted && status.kind !== "error" && (
        <p className="text-meta text-muted-foreground tabular-nums">{t("cooldown", { seconds })}</p>
      )}
    </div>
  );
}
