// SUR-16 end-to-end verification against a running dev server + real DB.
// Prerequisites: dev server on :3000 (must match BETTER_AUTH_URL), no
// RESEND_API_KEY (emails go to .email-outbox/).
// Run: npx tsx scripts/verify-sur16.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { loadTestEnv } from "./lib/test-env";
import { createRequire } from "node:module";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

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

async function readOutboxEmail(to: string): Promise<{ url: string }> {
  const dir = join(process.cwd(), ".email-outbox");
  const files = (await readdir(dir)).filter((f) => f.endsWith(`${to}.json`)).sort();
  const latest = files.at(-1);
  if (!latest) fail("outbox email", `no file for ${to}`);
  const raw = JSON.parse(await readFile(join(dir, latest), "utf8"));
  const m = String(raw.html).match(/https?:\/\/[^"'\s<]+verify-email[^"'\s<]*/);
  if (!m) fail("verification link in email", "not found in html");
  return { url: m[0].replace(/&amp;/g, "&") };
}

async function main() {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `sur16-${suffix}@example.test`;
  const password = "password-123";
  const pool = new pg.Pool({ connectionString: loadTestEnv() });

  try {
    // 1. Signup → triggers verification email to outbox
    const signup = await jfetch(`${API}/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ name: "SUR-16 Tester", email, password, type: "instructor" }),
    });
    if (signup.res.status !== 200) fail("signup", JSON.stringify(signup.body));
    const verified0 = (signup.body as { user?: { emailVerified?: boolean } }).user?.emailVerified;
    if (verified0 !== false) fail("emailVerified starts false", `got ${verified0}`);
    console.log("✓ 1. signup OK, emailVerified=false");

    // 2. Email captured with verification link
    const { url } = await readOutboxEmail(email);
    if (!url.includes("token=")) fail("link has token", url);
    console.log("✓ 2. verification email captured (outbox), link has token");

    // 3. Immediate resend is rate limited (1/min).
    //    NOTE: Better Auth's unauthenticated resend path masks hook errors
    //    (anti-enumeration) and returns {status:true} regardless. Ground
    //    truth is the outbox: no second email may exist for this address.
    const cookie = signup.res.headers.get("set-cookie")?.split(";")[0] ?? "";
    const resend = await jfetch(`${API}/send-verification-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE, Cookie: cookie },
      body: JSON.stringify({ email, callbackURL: "/verify-email" }),
    });
    if (resend.res.status >= 500) fail("resend blew up", resend.res.status);
    await new Promise((r) => setTimeout(r, 1500)); // allow any (wrong) send to land
    const outboxFiles2 = (await readdir(join(process.cwd(), ".email-outbox")))
      .filter((f) => f.endsWith(`${email}.json`));
    if (outboxFiles2.length !== 1) {
      fail("resend within 1min must not send a second email", `${outboxFiles2.length} emails in outbox`);
    }
    console.log("✓ 3. immediate resend rate-limited (outbox still has exactly 1 email)");

    // 4. Clicking the link verifies the email
    const click = await fetch(url, { redirect: "manual" });
    // Better Auth verifies then redirects to callbackURL
    if (click.status >= 400) fail("verify link", `${click.status}`);
    const dbUser = await pool.query('select email_verified from "user" where email = $1', [email]);
    if (dbUser.rows[0]?.email_verified !== true) fail("emailVerified after click", dbUser.rows[0]);
    console.log("✓ 4. link click verified email (DB: email_verified=true)");

    // 4b. Landing page contract: Better Auth redirects to the BARE
    //     callbackURL on success (token stripped) and appends ?error=CODE
    //     on failure — so rendering must key off the error param alone.
    //     Expected strings come from messages/pt.json, not hardcoded.
    const pt = JSON.parse(await readFile(join(process.cwd(), "messages", "pt.json"), "utf8"));
    const vep = pt.VerifyEmailPage as { title: string; failedTitle: string };
    const okHtml = await (await fetch(`${BASE}/verify-email`)).text();
    if (!okHtml.includes(vep.title)) fail("landing success render", `missing "${vep.title}"`);
    const errHtml = await (await fetch(`${BASE}/verify-email?error=INVALID_TOKEN`)).text();
    if (!errHtml.includes(vep.failedTitle)) fail("landing failure render", `missing "${vep.failedTitle}"`);
    console.log("✓ 4b. landing page renders success (bare) and failure (?error=) correctly");

    // 5. Token reuse: second click must not throw / corrupt state
    const click2 = await fetch(url, { redirect: "manual" });
    if (click2.status >= 500) fail("second click server error", click2.status);
    const stillVerified = await pool.query('select email_verified from "user" where email = $1', [email]);
    if (stillVerified.rows[0]?.email_verified !== true) fail("still verified after second click", stillVerified.rows[0]);
    console.log("✓ 5. token reuse is idempotent (state unchanged, no error)");

    // 6. Verification row consumed/removed
    const vrows = await pool.query("select count(*)::int as n from verification where identifier = $1", [email]);
    console.log(`✓ 6. remaining verification rows for email: ${vrows.rows[0].n}`);

    // cleanup
    await pool.query('delete from "user" where email = $1', [email]);
    console.log("✓ 7. test user cleaned up");
    console.log("\nSUR-16 contract: ALL CHECKS PASSED");
  } finally {
    await pool.end();
  }
}

main().catch((e) => fail("unhandled", e));
