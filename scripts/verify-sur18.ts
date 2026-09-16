// SUR-18 end-to-end verification against a running dev server + real DB.
// Prerequisites: dev server on :3000 (must match BETTER_AUTH_URL), no
// RESEND_API_KEY needed (no email involved).
// Run: npx tsx scripts/verify-sur18.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { createRequire } from "node:module";
import crypto from "node:crypto";

const require = createRequire(process.cwd() + "/");
const pg = require("pg");
type Pool = InstanceType<typeof pg.Pool>;

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
  return { res, body, headers: res.headers };
}

type SessionRow = {
  id: string;
  token: string;
  created_at: string;
  expires_at: string;
  ttl_days: number;
};

type MinimalSession = { session?: { token?: string } | null };

async function sessionRows(pool: Pool, email: string) {
  const r = await pool.query(
    'select id, token, created_at, expires_at, round(extract(epoch from (expires_at - created_at))/86400)::int as ttl_days from session where user_id = (select id from "user" where email = $1) order by created_at',
    [email],
  );
  return r.rows as SessionRow[];
}

async function main() {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `sur18-${suffix}@example.test`;
  const password = "password-123";
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // 0. Sign up (rate limiter irrelevant here — no emails requested).
    const signup = await jfetch(`${API}/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ name: "SUR-18 Tester", email, password, type: "instructor" }),
    });
    if (signup.res.status !== 200) fail("signup", JSON.stringify(signup.body));

    // 1. Session TTL is 30 days (expires_at - created_at in SQL — the
    //    column is timestamp-without-tz; never compare against Date.now()).
    let rows = await sessionRows(pool, email);
    if (rows.length !== 1) fail("session rows after signup", rows.length);
    if (rows[0].ttl_days !== 30) fail("session TTL", `${rows[0].ttl_days}d (want 30)`);
    console.log("✓ 1. session TTL = 30 days");

    const cookie1 = signup.headers.get("set-cookie")?.split(";")[0] ?? "";
    if (!cookie1) fail("session cookie", "none");

    // 2. Multi-device: a second sign-in creates an independent session.
    const signin2 = await jfetch(`${API}/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email, password }),
    });
    if (signin2.res.status !== 200) fail("second sign-in", JSON.stringify(signin2.body));
    const cookie2 = signin2.headers.get("set-cookie")?.split(";")[0] ?? "";
    rows = await sessionRows(pool, email);
    if (rows.length !== 2) fail("multi-device rows", rows.length);
    console.log("✓ 2. multi-device: 2 independent sessions");

    // 3. revoke-other-sessions keeps only the caller's session.
    //    (body: {} — BA 1.6 chokes on a JSON content-type with empty body)
    const revOthers = await jfetch(`${API}/revoke-other-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE, Cookie: cookie2 },
      body: JSON.stringify({}),
    });
    if (revOthers.res.status !== 200) fail("revoke-other-sessions", JSON.stringify(revOthers.body));
    rows = await sessionRows(pool, email);
    if (rows.length !== 1) fail("rows after revoke-others", rows.length);
    const sess = await jfetch(`${API}/get-session`, { headers: { Origin: BASE, Cookie: cookie1 } });
    if (sess.body && (sess.body as MinimalSession).session) fail("revoked device still active", "cookie1 alive");
    console.log("✓ 3. revoke-other-sessions: device 1 dead, device 2 alive");

    // 4. Sliding refresh: age the session past updateAge (24h), then use
    //    it — expires_at must slide forward. We simulate age by backdating
    //    created_at/updated_at/expires_at in the DB (auth code recomputes
    //    expiry as now+30d when updateAge has elapsed).
    await pool.query("update session set created_at = now() - interval '25 hours', updated_at = now() - interval '25 hours', expires_at = now() - interval '25 hours' + interval '30 days' where token = $1", [rows[0].token]);
    const before = rows[0].expires_at;
    const use = await jfetch(`${API}/get-session`, { headers: { Origin: BASE, Cookie: cookie2 } });
    if (use.res.status !== 200 || !((use.body as MinimalSession)?.session)) fail("aged session use", use.res.status);
    rows = await sessionRows(pool, email);
    const slid = new Date(rows[0].expires_at).getTime() > new Date(before).getTime();
    if (!slid) fail("sliding refresh", `expires_at did not advance (before=${before}, after=${rows[0].expires_at})`);
    console.log("✓ 4. sliding refresh: expiry advanced after 24h+ of inactivity");

    // 5. list-sessions returns the caller's sessions.
    const list = await jfetch(`${API}/list-sessions`, { headers: { Origin: BASE, Cookie: cookie2 } });
    const listRows = list.body as { token: string }[];
    if (!Array.isArray(listRows) || listRows.length !== 1) fail("list-sessions", listRows);
    console.log("✓ 5. list-sessions returns exactly the live session");

    // 6. Password change with revokeOtherSessions: new sessions from the
    //    change survive; the (already revoked) old ones stay dead. Sign
    //    in on a second device again, then change password from device 2.
    const signin3 = await jfetch(`${API}/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email, password }),
    });
    const cookie3 = signin3.headers.get("set-cookie")?.split(";")[0] ?? "";
    const chpw = await jfetch(`${API}/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE, Cookie: cookie2 },
      body: JSON.stringify({ currentPassword: password, newPassword: "password-456", revokeOtherSessions: true }),
    });
    if (chpw.res.status !== 200) fail("change-password", JSON.stringify(chpw.body));
    const dead = await jfetch(`${API}/get-session`, { headers: { Origin: BASE, Cookie: cookie3 } });
    if (((dead.body as MinimalSession)?.session)) fail("other session survived password change", "cookie3 alive");
    // BA 1.6 rotates the session on change-password (fixation defense):
    // ALL old sessions die, a brand-new one is created and set via the
    // response cookie. The user stays signed in — with a new cookie.
    const rotatedCookie = chpw.headers.get("set-cookie")?.split(";")[0] ?? "";
    if (!rotatedCookie) fail("session rotation", "no set-cookie on change-password");
    const alive = await jfetch(`${API}/get-session`, { headers: { Origin: BASE, Cookie: rotatedCookie } });
    if (!((alive.body as MinimalSession)?.session)) fail("rotated session dead", "new cookie rejected");
    console.log("✓ 6. password change revokes ALL sessions, rotates current (new cookie alive)");

    // 7. Old password no longer signs in; new one does.
    const oldPw = await jfetch(`${API}/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email, password }),
    });
    if (oldPw.res.status === 200) fail("old password accepted", "200");
    const newPw = await jfetch(`${API}/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email, password: "password-456" }),
    });
    if (newPw.res.status !== 200) fail("new password rejected", JSON.stringify(newPw.body));
    console.log("✓ 7. old password rejected, new password signs in");

    // 8. revoke-sessions + sign-out = "log out everywhere".
    const everywhere = await jfetch(`${API}/revoke-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE, Cookie: rotatedCookie },
      body: JSON.stringify({}),
    });
    if (everywhere.res.status !== 200) fail("revoke-sessions", JSON.stringify(everywhere.body));
    rows = await sessionRows(pool, email);
    if (rows.length !== 0) fail("rows after revoke-sessions", rows.length);
    console.log("✓ 8. log out everywhere: zero live sessions");

    // 9. /account redirects to /sign-in when signed out.
    const acct = await fetch(`${BASE}/account`, { redirect: "manual" });
    if (acct.status !== 307 && acct.status !== 302) fail("/account guard", acct.status);
    const loc = acct.headers.get("location") ?? "";
    if (!loc.includes("/sign-in")) fail("/account redirect target", loc);
    console.log("✓ 9. /account redirects to /sign-in when signed out");

    // cleanup
    await pool.query('delete from "user" where email = $1', [email]);
    console.log("✓ 10. test user cleaned up");
    console.log("\nSUR-18 contract: ALL CHECKS PASSED");
  } finally {
    await pool.end();
  }
}

main().catch((e) => fail("unhandled", e));
