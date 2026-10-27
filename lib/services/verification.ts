import { and, desc, eq, gt, sql } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { db } from "@/lib/db";
import { verificationEmailLog } from "@/lib/db/schema/app";

/**
 * Rate limits for verification-email sends, per the Auth PRD (SUR-16):
 * max 1 per minute and max 5 per 24h per email address.
 *
 * Also applied to password-reset emails (SUR-17): the same per-email
 * budget is shared between both email kinds, which keeps the total
 * email volume per address bounded. Reset tokens themselves are stored
 * server-side (verification table) and are strictly single-use, unlike
 * the stateless JWT verification tokens.
 *
 * Better Auth 1.6 verification tokens are stateless JWTs — the `verification`
 * table stays empty — so send volume is tracked in `verification_email_log`.
 * The caller records the send (recordVerificationEmailSent) only after the
 * email is actually handed to the transport.
 */
const MIN_INTERVAL_MS = 60_000;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const DAILY_MAX = 5;

/**
 * `code` on the limiter's 429s, so a client can tell the 1-per-minute
 * cooldown from the daily cap without parsing the message. The cooldown
 * error also carries `retryAfter` (seconds) in its body and a Retry-After
 * header.
 */
export const VERIFICATION_EMAIL_LIMIT = {
  cooldown: "VERIFICATION_EMAIL_COOLDOWN",
  daily: "VERIFICATION_EMAIL_DAILY_LIMIT",
} as const;
export type VerificationEmailLimitCode =
  (typeof VERIFICATION_EMAIL_LIMIT)[keyof typeof VERIFICATION_EMAIL_LIMIT];

export async function enforceVerificationEmailRateLimit(
  email: string,
): Promise<void> {
  const [latest] = await db
    .select({ sentAt: verificationEmailLog.sentAt })
    .from(verificationEmailLog)
    .where(eq(verificationEmailLog.email, email))
    .orderBy(desc(verificationEmailLog.sentAt))
    .limit(1);

  const now = Date.now();
  if (latest && withinMinuteWindow(latest.sentAt, new Date(now))) {
    const retryAfter = Math.max(1, Math.ceil((latest.sentAt.getTime() + MIN_INTERVAL_MS - now) / 1000));
    throw new APIError(
      "TOO_MANY_REQUESTS",
      {
        message: "Já te enviámos um email há pouco. Espera um minuto e tenta novamente.",
        code: VERIFICATION_EMAIL_LIMIT.cooldown,
        retryAfter,
      },
      { "Retry-After": String(retryAfter) },
    );
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(verificationEmailLog)
    .where(
      and(
        eq(verificationEmailLog.email, email),
        gt(verificationEmailLog.sentAt, new Date(Date.now() - DAILY_WINDOW_MS)),
      ),
    );

  if (dailyRemaining(count) === 0) {
    throw new APIError("TOO_MANY_REQUESTS", {
      message: "Atingiste o limite de emails por hoje. Tenta novamente amanhã.",
      code: VERIFICATION_EMAIL_LIMIT.daily,
    });
  }
}

export async function recordVerificationEmailSent(email: string): Promise<void> {
  await db.insert(verificationEmailLog).values({ email });
}

/**
 * Pure helpers for the verification-email rate limiter. The DB-bound
 * functions stay above; the window arithmetic lives here so it can be
 * unit-tested without a database.
 */

/** True if a send at `lastSentAt` violates the 1/min minimum interval. */
export function withinMinuteWindow(lastSentAt: Date, now: Date): boolean {
  return now.getTime() - lastSentAt.getTime() < MIN_INTERVAL_MS;
}

/** Remaining sends allowed in the rolling 24h window. */
export function dailyRemaining(recentCount: number): number {
  return Math.max(0, DAILY_MAX - recentCount);
}

