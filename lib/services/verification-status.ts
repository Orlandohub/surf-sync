import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { verificationEmailLog } from "@/lib/db/schema/app";

/**
 * Read-only view of the per-address email budget that
 * lib/services/verification.ts enforces (1 per minute, 5 per 24 h, shared
 * by confirmation and password-reset emails).
 *
 * Better Auth 1.6 logs and swallows the limiter's errors, so
 * /send-verification-email answers 200 even when no email went out. Screens
 * that offer "Reenviar email" read this first, so their cooldown and daily
 * cap start from what the server actually sent.
 */
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

export type VerificationEmailStatus = {
  /** When the last email (confirmation or reset) went to this address. */
  lastSentAt: Date | null;
  /** Emails sent to this address in the last 24 h. */
  sentToday: number;
};

export async function verificationEmailStatus(email: string): Promise<VerificationEmailStatus> {
  const [[latest], [{ count }]] = await Promise.all([
    db
      .select({ sentAt: verificationEmailLog.sentAt })
      .from(verificationEmailLog)
      .where(eq(verificationEmailLog.email, email))
      .orderBy(desc(verificationEmailLog.sentAt))
      .limit(1),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(verificationEmailLog)
      .where(
        and(
          eq(verificationEmailLog.email, email),
          gt(verificationEmailLog.sentAt, new Date(Date.now() - DAILY_WINDOW_MS)),
        ),
      ),
  ]);
  return { lastSentAt: latest?.sentAt ?? null, sentToday: count };
}
