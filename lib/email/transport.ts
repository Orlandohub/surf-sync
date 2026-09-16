import { Resend } from "resend";

/**
 * Email transport seam. In production (RESEND_API_KEY set) sends via Resend.
 * Locally / in preview without a key, writes emails to .email-outbox/ so the
 * verification flow is fully testable without a provider or network.
 */
export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;

  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
}

async function writeToOutbox(input: SendEmailInput): Promise<void> {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const dir = path.join(process.cwd(), ".email-outbox");
  await mkdir(dir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `${stamp}-${input.to.replace(/[^a-z0-9@._-]/gi, "_")}.json`);
  await writeFile(
    file,
    JSON.stringify({ to: input.to, subject: input.subject, html: input.html, text: input.text, sentAt: new Date().toISOString() }, null, 2),
  );
}

export async function sendEmail(input: SendEmailInput): Promise<{ id: string | null; dev: boolean }> {
  const client = getResend();

  if (!client) {
    await writeToOutbox(input);
    return { id: null, dev: true };
  }

  const { data, error } = await client.emails.send({
    from: process.env.EMAIL_FROM ?? "SurfSync <onboarding@resend.dev>",
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }

  return { id: data?.id ?? null, dev: false };
}
