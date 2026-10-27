"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { resendErrorKey, type AuthClientError, type ResendErrorKey } from "@/components/auth/auth-helpers";
import type { VerificationEmailLimitCode } from "@/lib/services/verification";
import { cn } from "@/lib/utils";

/** Matches the server's limiter (lib/services/verification.ts). */
const COOLDOWN_MS = 60_000;
const DAILY_MAX = 5;

// The limiter's 429 codes. Typed against the server's constant (a
// type-only import, nothing server-side is bundled), so renaming a code
// there breaks the typecheck here.
const COOLDOWN_CODE: VerificationEmailLimitCode = "VERIFICATION_EMAIL_COOLDOWN";
const DAILY_CODE: VerificationEmailLimitCode = "VERIFICATION_EMAIL_DAILY_LIMIT";

type ResendClientError = AuthClientError & { retryAfter?: unknown };

/** Our limiter's refusals by code; anything else (Better Auth's own
 *  endpoint limiter, "already verified"…) by status and message. */
function resendKey(error: ResendClientError): ResendErrorKey {
  if (error?.code === DAILY_CODE) return "daily";
  if (error?.code === COOLDOWN_CODE) return "wait";
  return resendErrorKey(error);
}

/** How long the server says to wait (cooldown 429s carry `retryAfter`, in s). */
function retryAfterMs(error: ResendClientError): number {
  const seconds = error?.retryAfter;
  return typeof seconds === "number" && seconds > 0 ? Math.min(seconds * 1000, COOLDOWN_MS) : COOLDOWN_MS;
}

type Status = { kind: "idle" } | { kind: "sent" } | { kind: "error"; key: ResendErrorKey };

/**
 * Where the email budget stands when the control first renders.
 * `sentAt`: when the last email went out (ms), to start in cooldown.
 * `sentCount`: emails already sent to this address in the last 24 h.
 * `now`: the server's render time, so the server and the first client
 * render compute the same countdown (no hydration mismatch).
 */
export type ResendStart = { sentAt?: number | null; sentCount?: number; now?: number };

export type ResendState = ReturnType<typeof useResendVerification>;

/**
 * "Reenviar email" for the email-confirmation link, with rate-limit
 * feedback. Shared by <ResendVerification> (auth screens), the /account
 * row and the instructor onboarding checklist.
 *
 * The server's limiter (1 per minute, 5 a day per address, shared with
 * password-reset emails) answers a signed-in resend with a 429 whose
 * `code` says which limit it hit (lib/auth/server.ts, hooks.before). The
 * control also keeps the same budget itself so it can count down without
 * asking: it starts from what the server already sent
 * (verificationEmailStatus, or the sign-up that just happened), waits 60 s
 * after every send, and stops at 5 a day. A 429 then covers what this page
 * can't know — an email sent from another tab or device, or a reset email
 * — and restarts the countdown from the server's `retryAfter`.
 */
export function useResendVerification(email: string, start: ResendStart = {}) {
  const { sentAt, sentCount = 0, now: renderedAt } = start;
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState<Status>({ kind: "idle" });
  const [count, setCount] = React.useState(sentCount);
  const [readyAt, setReadyAt] = React.useState(sentAt ? sentAt + COOLDOWN_MS : 0);
  const [now, setNow] = React.useState(() => renderedAt ?? Date.now());

  const waiting = readyAt > now;
  const seconds = Math.max(0, Math.ceil((readyAt - now) / 1000));
  const exhausted = count >= DAILY_MAX;
  const done = status.kind === "error" && status.key === "alreadyVerified";
  const blocked = waiting || exhausted || done;

  // Tick once a second while cooling down (the first tick also moves a
  // server-rendered countdown onto this device's clock).
  React.useEffect(() => {
    if (!waiting) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [waiting]);

  async function send() {
    if (pending || blocked) return;
    setPending(true);
    setStatus({ kind: "idle" });
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/verify-email",
      });
      if (error) {
        const key = resendKey(error);
        setStatus({ kind: "error", key });
        if (key === "wait") {
          const at = Date.now();
          setReadyAt(at + retryAfterMs(error));
          setNow(at);
        }
        if (key === "daily") setCount(DAILY_MAX);
        return;
      }
      setStatus({ kind: "sent" });
      setCount((c) => c + 1);
      setReadyAt(Date.now() + COOLDOWN_MS);
      setNow(Date.now());
    } catch (err) {
      console.error(err);
      setStatus({ kind: "error", key: "generic" });
    } finally {
      setPending(false);
    }
  }

  // A cooldown refusal is over once the countdown ends: stop showing it.
  const error = status.kind === "error" && !(status.key === "wait" && !waiting) ? status.key : null;

  return { send, pending, status, error, waiting, seconds, exhausted, blocked };
}

/**
 * The lines under a resend control: "Email reenviado." (a polite live
 * region, always mounted — out of the flow while empty, so it adds no
 * gap), an error (role=alert), the daily limit, and the countdown (also
 * under a cooldown refusal, so it says when to try again). Renders a
 * fragment: the parent column sets the spacing. `sent` replaces the
 * "Email reenviado." line.
 */
export function ResendStatus({ state, sent }: { state: ResendState; sent?: React.ReactNode }) {
  const t = useTranslations("Auth.resend");
  const { status, error, waiting, seconds, exhausted } = state;
  return (
    <>
      <div aria-live="polite" className="empty:absolute">
        {status.kind === "sent" && <p className="text-meta text-muted-foreground">{sent ?? t("sent")}</p>}
      </div>
      {error && <FieldError>{t(`errors.${error}`)}</FieldError>}
      {exhausted && !error && <p className="text-meta text-muted-foreground">{t("errors.daily")}</p>}
      {waiting && !exhausted && (!error || error === "wait") && (
        <p className="text-meta text-muted-foreground tabular-nums">{t("cooldown", { seconds })}</p>
      )}
    </>
  );
}

/**
 * Full-width "Reenviar email" button plus its status lines. The button
 * stays focusable while it waits (aria-disabled), so keyboard focus isn't
 * dropped to the page when a send starts the cooldown.
 */
export function ResendVerification({
  email,
  start,
  variant = "outline",
}: {
  email: string;
  start?: ResendStart;
  variant?: "default" | "outline";
}) {
  const t = useTranslations("Auth.resend");
  const state = useResendVerification(email, start);

  return (
    <div data-slot="resend-verification" className="flex flex-col gap-3">
      <Button
        type="button"
        variant={variant}
        size="lg"
        onClick={state.send}
        disabled={state.blocked}
        focusableWhenDisabled
        pending={state.pending}
        pendingLabel={t("pending")}
        className={cn(state.blocked && !state.pending && "cursor-not-allowed opacity-40")}
      >
        {t("submit")}
      </Button>
      <ResendStatus state={state} />
    </div>
  );
}
