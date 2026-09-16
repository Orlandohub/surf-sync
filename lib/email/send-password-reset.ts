import { sendEmail } from "@/lib/email/transport";
import { renderPasswordResetEmail } from "@/lib/email/templates/password-reset";

/**
 * Sends the password-reset email. Called by Better Auth's
 * sendResetPassword hook (POST /request-password-reset).
 *
 * Same transport seam as verification email: Resend in production,
 * .email-outbox/ files locally.
 */
export async function sendPasswordResetEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}): Promise<void> {
  const { html, text } = await renderPasswordResetEmail(url);
  await sendEmail({
    to,
    subject: "Redefina a sua palavra-passe — SurfSync",
    html,
    text,
  });
}
