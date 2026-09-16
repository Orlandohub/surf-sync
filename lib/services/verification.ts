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

export async function enforceVerificationEmailRateLimit(
  email: string,
): Promise<void> {
  const [latest] = await db
    .select({ sentAt: verificationEmailLog.sentAt })
    .from(verificationEmailLog)
    .where(eq(verificationEmailLog.email, email))
    .orderBy(desc(verificationEmailLog.sentAt))
    .limit(1);

  if (latest && Date.now() - latest.sentAt.getTime() < MIN_INTERVAL_MS) {
    throw new APIError("TOO_MANY_REQUESTS", {
      message: "Please wait a minute before requesting another email.",
    });
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

  if (count >= DAILY_MAX) {
    throw new APIError("TOO_MANY_REQUESTS", {
      message: "Daily verification email limit reached. Try again tomorrow.",
    });
  }
}

export async function recordVerificationEmailSent(email: string): Promise<void> {
  await db.insert(verificationEmailLog).values({ email });
}
