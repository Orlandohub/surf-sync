"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import {
  createSchool,
  inviteSchoolStaff,
  createSchoolSchema,
  inviteStaffSchema,
} from "@/lib/services/school";
import { recordVerificationEmailSent } from "@/lib/services/verification";
import { sendStaffInvitationEmail } from "@/lib/email/send-staff-invitation";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function caller(): Promise<{ id: string; email: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("UNAUTHORIZED");
  return { id: session.user.id, email: session.user.email };
}

export async function createSchoolAction(input: unknown): Promise<ActionResult> {
  try {
    const { id } = await caller();
    const parsed = createSchoolSchema.parse(input);
    await createSchool(id, parsed);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

export async function inviteStaffAction(input: unknown): Promise<ActionResult> {
  try {
    const { id } = await caller();
    const parsed = inviteStaffSchema.parse(input);
    const schoolName = await inviteSchoolStaff(id, parsed);
    void schoolName;
    // Email send is best-effort inline for MVP (SUR-29 tracks queue
    // migration); record after send like other emails.
    try {
      await sendStaffInvitationEmail({
        to: parsed.email,
        schoolName: schoolName ?? "a sua escola",
        signupUrl: `${process.env.BETTER_AUTH_URL?.replace(/\/api\/auth$/, "") ?? ""}/sign-up`,
      });
      await recordVerificationEmailSent(parsed.email);
    } catch {
      // Invite row exists; acceptance is automatic on signup regardless.
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

function toMessage(e: unknown): string {
  if (e && typeof e === "object" && "body" in e) {
    const body = (e as { body?: { message?: string } }).body;
    if (body?.message) return body.message;
  }
  if (e instanceof Error && e.message === "UNAUTHORIZED") return "Sessão expirada. Inicie sessão novamente.";
  return "Ocorreu um erro. Tente novamente.";
}
