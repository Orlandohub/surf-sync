// SUR-15 contract verification against a running dev server + real DB.
// Run: npx pnpm dev (port 3000, must match BETTER_AUTH_URL), then
// npx tsx scripts/verify-sur15.ts
const BASE = "http://localhost:3000";
const API = `${BASE}/api/auth`;

function apiErr(label: string, e: unknown) {
  console.error(`✗ ${label}:`, e instanceof Error ? e.message : e);
  process.exit(1);
}

async function jfetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON */
  }
  return { res, body };
}

async function main() {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `sur15-${suffix}@example.test`;
  const password = "password-123";

  // 1. Sign-up page renders (200 HTML)
  const page = await fetch(`${BASE}/sign-up`);
  if (page.status !== 200) apiErr("sign-up page render", `status ${page.status}`);
  console.log("✓ 1. /sign-up renders (200)");

  // 2. Instructor signup via Better Auth endpoint sets type=teacher
  const signup = await jfetch(`${API}/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
    },
    body: JSON.stringify({
      name: "SUR-15 Instructor",
      email,
      password,
      type: "instructor",
    }),
  });
  if (signup.res.status !== 200)
    apiErr("instructor signup", JSON.stringify(signup.body));
  const user = (signup.body as { user?: { type?: string; id?: string } }).user;
  if (user?.type !== "instructor")
    apiErr("type stored as instructor", `got ${user?.type}`);
  console.log("✓ 2. signup with type=instructor stored:", user?.type);

  // 3. Same email again (same OR different type) is blocked
  const dupSame = await jfetch(`${API}/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
    },
    body: JSON.stringify({
      name: "Dup",
      email,
      password,
      type: "instructor",
    }),
  });
  if (dupSame.res.status === 200)
    apiErr("duplicate email should fail", "got 200");
  console.log("✓ 3. duplicate email rejected:", dupSame.res.status);

  const dupCross = await jfetch(`${API}/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
    },
    body: JSON.stringify({
      name: "Dup",
      email,
      password,
      type: "school_staff",
    }),
  });
  if (dupCross.res.status === 200)
    apiErr("cross-type email reuse should fail", "got 200");
  console.log("✓ 4. cross-type email reuse rejected:", dupCross.res.status);

  // 4. Type mutation blocked at DB level (trigger) — direct SQL, the harshest path
  const { loadEnvConfig } = await import("@next/env");
  loadEnvConfig(process.cwd());
import { loadTestEnv } from "./lib/test-env";
  const { createRequire } = await import("node:module");
  const require = createRequire(process.cwd() + "/");
  const pg = require("pg");
  const pool = new pg.Pool({ connectionString: loadTestEnv() });
  try {
    // allowed: update name (trigger must NOT fire)
    await pool.query('update "user" set full_name = $1 where email = $2', [
      "Renamed Instructor",
      email,
    ]);
    console.log("✓ 5. non-type update passes trigger");

    // blocked: update type
    try {
      await pool.query(
        'update "user" set type = $1 where email = $2',
        ["school_staff", email],
      );
      apiErr("type update should be blocked by trigger", "update succeeded!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (!msg.includes("immutable"))
        apiErr("trigger fired for wrong reason", msg);
      console.log("✓ 6. DB trigger blocks type change:", msg.trim());
    }

    // cleanup test user (cascade)
    await pool.query('delete from "user" where email = $1', [email]);
    const left = await pool.query('select count(*)::int as n from "user" where email = $1', [email]);
    if (left.rows[0].n !== 0) apiErr("cleanup", "user still present");
    console.log("✓ 7. test user cleaned up");
  } finally {
    await pool.end();
  }

  console.log("\nSUR-15 contract: ALL CHECKS PASSED");
}

main().catch((e) => apiErr("unhandled", e));
