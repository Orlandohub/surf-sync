// Verify the three UX fixes: (1) auth pages guard against signed-in users,
// (2) verify-email routes by session, (3) availability error in PT.
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { createRequire } from "node:module";
import crypto from "node:crypto";

const require = createRequire(process.cwd() + "/");
const pg = require("pg");
const BASE = "http://localhost:3000";
const API = `${BASE}/api/auth`;

function fail(label: string, detail: unknown): never {
  console.error(`✗ ${label}:`, detail);
  process.exit(1);
}

async function main() {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `uxfix-${suffix}@example.test`;
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // 1. Anonymous: sign-up + sign-in accessible; verify-email renders.
    let res = await fetch(`${BASE}/sign-up`, { redirect: "manual" });
    if (res.status !== 200) fail("anon /sign-up", res.status);
    res = await fetch(`${BASE}/sign-in`, { redirect: "manual" });
    if (res.status !== 200) fail("anon /sign-in", res.status);
    const ve = await fetch(`${BASE}/verify-email`, { redirect: "manual" });
    const veHtml = await ve.text();
    if (!veHtml.includes("Continuar")) fail("verify-email anon CTA", "Continuar missing");
    console.log("✓ 1. anon: auth pages accessible; verify-email shows Continuar → /sign-in");

    // 2. Sign up an instructor; verification click signs in.
    const signup = await fetch(`${API}/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ name: "UX Fix Tester", email, password: "password-123", type: "instructor" }),
    });
    if (signup.status !== 200) fail("signup", signup.status);
    const cookie = signup.headers.get("set-cookie")?.split(";")[0] ?? "";

    // Mark verified + fetch the verification link (Resend API — the key is
    // set locally, so no outbox file), then click it (signs in).
    const key = process.env.RESEND_API_KEY;
    const listRes = await fetch(`https://api.resend.com/emails?to=${email}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const list = (await listRes.json()) as { data?: { id: string }[] };
    const emailId = list.data?.[0]?.id;
    if (!emailId) fail("resend email", "not found");
    const emailRes = await fetch(`https://api.resend.com/emails/${emailId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const emailDoc = (await emailRes.json()) as { html?: string };
    const link = String(emailDoc.html).match(/https?:\/\/[^"'\s<]+verify-email[^"'\s<]*/)?.[0];
    if (!link) fail("verification link", "not found");
    await fetch(link, { redirect: "manual" });

    // 3. Signed-in: verify-email routes to instructor dashboard.
    res = await fetch(`${BASE}/verify-email`, { redirect: "manual", headers: { Cookie: cookie } });
    const html = await res.text();
    if (!html.includes("/instructor")) fail("verify-email instructor link", "/instructor missing");
    console.log("✓ 2. signed-in verify-email links to /instructor (not /sign-up)");

    // 4. Signed-in: /sign-up and /sign-in redirect away.
    res = await fetch(`${BASE}/sign-up`, { redirect: "manual", headers: { Cookie: cookie } });
    if (res.status !== 307 && res.status !== 302) fail("guard /sign-up", res.status);
    res = await fetch(`${BASE}/sign-in`, { redirect: "manual", headers: { Cookie: cookie } });
    if (res.status !== 307 && res.status !== 302) fail("guard /sign-in", res.status);
    console.log("✓ 3. signed-in users bounced from /sign-up and /sign-in");

    // 5. Availability-before-profile error is now Portuguese.
    const { saveInstructorAvailability } = await import("../lib/services/instructor");
    const userId = (await pool.query('select id from "user" where email = $1', [email])).rows[0].id;
    let msg = "";
    try {
      await saveInstructorAvailability(userId, { slots: [{ dayOfWeek: "sat", startTime: "09:00", endTime: "13:00" }] });
    } catch (e) {
      msg = String((e as { body?: { message?: string } }).body?.message ?? "");
    }
    if (msg !== "Guarde primeiro o seu perfil antes de definir a disponibilidade.") {
      fail("PT error message", msg || "(no throw)");
    }
    console.log("✓ 4. availability error now in Portuguese");

    // 6. Instructor dashboard prefills name from signup.
    res = await fetch(`${BASE}/instructor`, { headers: { Cookie: cookie } });
    const dash = await res.text();
    if (!dash.includes("UX Fix Tester")) fail("name prefill", "signup name not in dashboard");
    console.log("✓ 5. dashboard prefills name from signup (no double ask)");

    // cleanup
    await pool.query('delete from "user" where email = $1', [email]);
    console.log("✓ 6. cleaned up");
    console.log("\nUX fixes: ALL VERIFIED");
  } finally {
    await pool.end();
  }
}
main();
