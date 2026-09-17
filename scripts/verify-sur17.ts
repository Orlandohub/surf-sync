// SUR-17 end-to-end verification against a running dev server + real DB.
// Prerequisites: dev server on :3000 (must match BETTER_AUTH_URL), no
// RESEND_API_KEY (emails go to .email-outbox/).
// NOTE: the per-email rate limiter (1/min) is shared between verification
// and reset emails, so this script waits out the 1-minute window after
// signup before requesting a reset.
// Run: npx tsx scripts/verify-sur17.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { loadTestEnv } from "./lib/test-env";
import { createRequire } from "node:module";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import crypto from "node:crypto";

const require = createRequire(process.cwd() + "/");
const pg = require("pg");

const BASE = "http://localhost:3000";
const API = `${BASE}/api/auth`;

function fail(label: string, detail: unknown): never {
  console.error(`✗ ${label}:`, detail instanceof Error ? detail.message : detail);
  process.exit(1);
}

async function jfetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  let body: unknown = null;
  try { body = await res.json(); } catch { /* non-JSON */ }
  return { res, body };
}

async function readOutboxEmail(to: string, kind: "verify" | "reset"): Promise<{ url: string }> {
  const dir = join(process.cwd(), ".email-outbox");
  const files = (await readdir(dir)).filter((f) => f.endsWith(`${to}.json`)).sort();
  const latest = files.at(-1);
  if (!latest) fail(`outbox ${kind} email`, `no file for ${to}`);
  const raw = JSON.parse(await readFile(join(dir, latest), "utf8"));
  const subject = String(raw.subject ?? "");
  const wanted = kind === "verify" ? "Verifique" : "Redefina";
  if (!subject.includes(wanted)) fail(`outbox ${kind} email subject`, subject);
  const m = String(raw.html).match(/https?:\/\/[^"'\s<]+reset-password[^"'\s<]*/);
  if (kind === "reset" && !m) fail("reset link in email", "not found in html");
  // For verify emails the link targets /api/auth/verify-email; the caller
  // decides which to use.
  const mv = String(raw.html).match(/https?:\/\/[^"'\s<]+verify-email[^"'\s<]*/);
  return {
    url: kind === "reset"
      ? (m?.[0] ?? "").replace(/&amp;/g, "&")
      : (mv?.[0] ?? "").replace(/&amp;/g, "&"),
  };
}

async function main() {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `sur17-${suffix}@example.test`;
  const password = "password-123";
  const newPassword = "password-456";
  const pool = new pg.Pool({ connectionString: loadTestEnv() });

  try {
    // 1. Sign up (sends verification email, establishes baseline for the
    //    shared rate limiter).
    const signup = await jfetch(`${API}/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ name: "SUR-17 Tester", email, password, type: "instructor" }),
    });
    if (signup.res.status !== 200) fail("signup", JSON.stringify(signup.body));
    console.log("✓ 1. signup OK");

    // 2. Request reset for a NON-EXISTENT address: must return the same
    //    generic {status:true} (anti-enumeration) and send nothing.
    const ghost = `sur17-ghost-${suffix}@example.test`;
    const ghostReq = await jfetch(`${API}/request-password-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email: ghost, redirectTo: "/reset-password" }),
    });
    if (ghostReq.res.status !== 200) fail("ghost reset status", ghostReq.res.status);
    const outboxBefore = (await readdir(join(process.cwd(), ".email-outbox"))).length;
    await new Promise((r) => setTimeout(r, 1500));
    const outboxAfterGhost = (await readdir(join(process.cwd(), ".email-outbox"))).length;
    if (outboxAfterGhost !== outboxBefore) fail("ghost reset leaked an email", "outbox grew");
    console.log("✓ 2. unknown email → generic response, no email sent");

    // 3. Wait out the shared 1/min rate window (signup email counted).
    console.log("   … waiting 61s for the shared 1/min email rate window");
    await new Promise((r) => setTimeout(r, 61_000));

    // 4. Request reset for the real address → email lands in outbox.
    const resetReq = await jfetch(`${API}/request-password-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email, redirectTo: "/reset-password" }),
    });
    if (resetReq.res.status !== 200) fail("reset request", JSON.stringify(resetReq.body));
    const { url: resetUrl } = await readOutboxEmail(email, "reset");
    if (!resetUrl.includes("/api/auth/reset-password/")) fail("reset link shape", resetUrl);
    console.log("✓ 3. reset email captured (outbox), link points at BA callback");

    // 5. Immediate second request is rate limited silently (1/min): generic
    //    response, but no second email.
    const resetReq2 = await jfetch(`${API}/request-password-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email, redirectTo: "/reset-password" }),
    });
    if (resetReq2.res.status >= 500) fail("second reset blew up", resetReq2.res.status);
    await new Promise((r) => setTimeout(r, 1500));
    const resetEmails = (await readdir(join(process.cwd(), ".email-outbox")))
      .filter((f) => f.endsWith(`${email}.json`));
    if (resetEmails.length !== 2) fail("rate limit", `${resetEmails.length} emails (expected 2: verify + reset)`);
    console.log("✓ 4. immediate second reset rate-limited silently (no extra email)");

    // 6. Token is stored server-side with 1h TTL. Compute from
    //    (expires_at - created_at) inside Postgres: the column is
    //    timestamp-without-time-zone, so comparing it against Date.now()
    //    in JS would mis-parse by the local UTC offset.
    const vrow = await pool.query(
      "select round(extract(epoch from (expires_at - created_at))/60)::int as ttl_min, expires_at > created_at as sane" +
        " from verification where identifier = $1",
      [`reset-password:${new URL(resetUrl).pathname.split("/").pop()}`],
    );
    if (vrow.rows.length !== 1) fail("verification row for reset token", vrow.rows);
    if (!vrow.rows[0].sane) fail("reset token expiry sane", vrow.rows[0]);
    if (vrow.rows[0].ttl_min !== 60) fail("reset token TTL", `${vrow.rows[0].ttl_min} min`);
    console.log("✓ 5. reset token stored server-side, TTL = 60 min");

    // 7. Email link → BA callback → redirects to /reset-password with token.
    const click = await fetch(resetUrl, { redirect: "manual" });
    if (click.status >= 400) fail("reset link click", click.status);
    const loc = click.headers.get("location") ?? "";
    if (!loc.includes("/reset-password?token=")) fail("callback redirect", loc);
    const token = new URL(loc, BASE).searchParams.get("token") ?? "";
    if (!token) fail("token extraction", loc);
    console.log("✓ 6. email link → callback → /reset-password?token=…");

    // 8. Landing page renders the form with a token; invalid state without.
    const pt = JSON.parse(await readFile(join(process.cwd(), "messages", "pt.json"), "utf8"));
    const okHtml = await (await fetch(`${BASE}/reset-password?token=${token}`)).text();
    if (!okHtml.includes(pt.ResetPasswordPage.title)) fail("form render", "title missing");
    const badHtml = await (await fetch(`${BASE}/reset-password?error=INVALID_TOKEN`)).text();
    if (!badHtml.includes(pt.ResetPasswordPage.invalid.title)) fail("invalid render", "invalid.title missing");
    console.log("✓ 7. /reset-password renders form (token) and invalid state (error)");

    // 9. Create a session, then reset the password: session must be revoked.
    const signin = await jfetch(`${API}/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email, password }),
    });
    if (signin.res.status !== 200) fail("sign-in before reset", JSON.stringify(signin.body));
    const cookie = signin.res.headers.get("set-cookie")?.split(";")[0] ?? "";
    if (!cookie) fail("session cookie", "none");
    const before = await pool.query("select count(*)::int as n from session where user_id = (select id from \"user\" where email = $1)", [email]);
    if (before.rows[0].n < 1) fail("session rows before reset", before.rows[0].n);
    console.log(`✓ 8. signed in (${before.rows[0].n} session row(s) created)`);

    const doReset = await jfetch(`${API}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ newPassword, token }),
    });
    if (doReset.res.status !== 200) fail("reset password", JSON.stringify(doReset.body));
    const after = await pool.query("select count(*)::int as n from session where user_id = (select id from \"user\" where email = $1)", [email]);
    if (after.rows[0].n !== 0) fail("sessions revoked", `${after.rows[0].n} remain`);
    console.log("✓ 9. password reset OK and ALL sessions revoked");

    // 10. Old session cookie is dead: /get-session must not return a user.
    const sess = await jfetch(`${API}/get-session`, {
      headers: { Origin: BASE, Cookie: cookie },
    });
    if (sess.body && (sess.body as { user?: unknown }).user) fail("revoked session still valid", "user returned");
    console.log("✓ 10. old session cookie rejected");

    // 11. Old password rejected; new password signs in.
    const oldPw = await jfetch(`${API}/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email, password }),
    });
    if (oldPw.res.status === 200) fail("old password still works", "sign-in succeeded");
    const newPw = await jfetch(`${API}/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email, password: newPassword }),
    });
    if (newPw.res.status !== 200) fail("new password sign-in", JSON.stringify(newPw.body));
    console.log("✓ 11. old password rejected, new password signs in");

    // 12. Token is single-use: replaying it fails.
    const replay = await jfetch(`${API}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ newPassword: "password-789", token }),
    });
    if (replay.res.status === 200) fail("token replay accepted", "single-use violated");
    console.log("✓ 12. token replay rejected (single-use)");

    // cleanup
    await pool.query('delete from "user" where email = $1', [email]);
    console.log("✓ 13. test user cleaned up");
    console.log("\nSUR-17 contract: ALL CHECKS PASSED");
  } finally {
    await pool.end();
  }
}

main().catch((e) => fail("unhandled", e));
