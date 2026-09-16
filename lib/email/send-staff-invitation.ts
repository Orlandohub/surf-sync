import { sendEmail } from "@/lib/email/transport";
import { renderStaffInvitationEmail } from "@/lib/email/templates/staff-invitation";

/**
 * Sends the school-staff invitation email (Epic 5). The invite is
 * accepted automatically when the invited address signs up as
 * school_staff and visits /school — the email only needs to bring them
 * to signup.
 */
export async function sendStaffInvitationEmail({
  to,
  schoolName,
  signupUrl,
}: {
  to: string;
  schoolName: string;
  signupUrl: string;
}): Promise<void> {
  const { html, text } = await renderStaffInvitationEmail(schoolName, signupUrl);
  await sendEmail({
    to,
    subject: `Convite para a equipa ${schoolName} — SurfSync`,
    html,
    text,
  });
}
