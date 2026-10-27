import { verificationEmailStatus } from "@/lib/services/verification-status";
import type { ResendStart } from "@/components/auth/resend-verification";

/**
 * Server side: where an address's email budget stands, as the starting
 * state of a resend control (/account, /verify-email). `now` is the render
 * time, so the server and the first client render show the same countdown.
 */
export async function resendStartFor(email: string): Promise<ResendStart> {
  const { lastSentAt, sentToday } = await verificationEmailStatus(email);
  return { sentAt: lastSentAt?.getTime() ?? null, sentCount: sentToday, now: Date.now() };
}
