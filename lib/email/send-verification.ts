import { sendEmail } from "@/lib/email/transport";
import { renderVerificationEmail } from "@/lib/email/templates/verification";

/**
 * Sends the email-verification email. Called by Better Auth's
 * sendVerificationEmail hook (signup auto-send + explicit resend endpoint).
 *
 * The transport seam (lib/email/transport.ts) sends via Resend when
 * RESEND_API_KEY is set and writes to .email-outbox/ otherwise, so the flow
 * is fully exercisable in dev without a provider.
 */
export async function sendVerificationEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}): Promise<void> {
  const { html, text } = await renderVerificationEmail(url);
  await sendEmail({
    to,
    subject: "Verifique o seu email — SurfSync",
    html,
    text,
  });
}
