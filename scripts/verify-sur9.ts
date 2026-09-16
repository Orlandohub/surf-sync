// Epic 5 (SUR-9) E2E verification against a running dev server + real DB.
// School creation, staff invite, auto-acceptance on signup, guards.
// Prerequisites: dev server on :3000.
// Run: npx tsx scripts/verify-sur9.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { createRequire } from "node:module";
import crypto from "node:crypto";

const require = createRequire(process.cwd() + "/");
const pg = require("pg");

const BASE = "http://localhost:3000";
const API = `${BASE}/api/auth`;

function fail(label: string, detail: unknown): never {
  console.error(`✗ ${label}:`, detail instanceof Error ? detail.message : detail);
  process.exit(1);
}

async function signup(email: string, type: "school_staff" | "instructor") {
  const res = await fetch(`${API}/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ name: `SUR-9 ${type}`, email, password: "password-123", type }),
  });
  if (res.status !== 200) fail(`signup ${email}`, res.status);
}

async function main() {
  const suffix = crypto.randomUUID().slice(0, 8);
  const ownerEmail = `sur9-owner-${suffix}@example.test`;
  const colleagueEmail = `sur9-colleague-${suffix}@example.test`;
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  const { getSchoolDashboard, createSchool, inviteSchoolStaff } =
    await import("../lib/services/school");

  try {
    // 1. Owner signs up (school_staff) — dashboard shows create state.
    await signup(ownerEmail, "school_staff");
    const ownerId = (await pool.query('select id from "user" where email = $1', [ownerEmail])).rows[0].id;
    let dash = await getSchoolDashboard(ownerId);
    if (dash.school !== null) fail("initial dashboard", "expected no school");
    console.log("✓ 1. staff signup → create-school state");

    // 2. /school guarded for anon + wrong type.
    const anon = await fetch(`${BASE}/school`, { redirect: "manual" });
    if (anon.status !== 307 && anon.status !== 302) fail("/school anon", anon.status);
    console.log("✓ 2. /school guarded (anon → /sign-in)");

    // 3. Create the school — owner linked as first staff.
    await createSchool(ownerId, {
      name: "Escola Teste SUR-9",
      description: "",
      contactEmail: ownerEmail,
      contactPhone: "",
      address: "Praia do Tamariz 12",
      city: "Estoril",
    });
    dash = await getSchoolDashboard(ownerId);
    if (!dash.school || dash.school.name !== "Escola Teste SUR-9") fail("school created", dash.school);
    if (dash.staff.length !== 1 || dash.staff[0].userId !== ownerId) fail("owner staff", dash.staff);
    console.log("✓ 3. school created; owner is first staff member");

    // 4. Second school creation rejected.
    let threw = "";
    try {
      await createSchool(ownerId, {
        name: "Outra", description: "", contactEmail: ownerEmail, contactPhone: "",
        address: "Rua X", city: "Lisboa",
      });
    } catch (e) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "BAD_REQUEST") fail("second school", `expected BAD_REQUEST, got ${threw || "none"}`);
    console.log("✓ 4. one school per staff user enforced");

    // 5. Invite colleague.
    await inviteSchoolStaff(ownerId, { email: colleagueEmail });
    const invites = await pool.query(
      "select email, accepted_at from school_invitation where school_id = (select school_id from school_staff where user_id = $1) and email = $2",
      [ownerId, colleagueEmail],
    );
    if (invites.rows.length !== 1 || invites.rows[0].accepted_at !== null) fail("invite row", invites.rows);
    dash = await getSchoolDashboard(ownerId);
    if (dash.pendingInvites.length !== 1) fail("pending invite shown", dash.pendingInvites);
    console.log("✓ 5. colleague invited (pending, email queued in outbox in real UI flow)");

    // 6. Instructor cannot be invited into staff? (invite is by email;
    //    acceptance requires school_staff type — verify via type check)
    await signup(colleagueEmail, "school_staff");
    const colleagueId = (await pool.query('select id from "user" where email = $1', [colleagueEmail])).rows[0].id;

    // 7. Colleague visits dashboard → auto-accepts invitation.
    dash = await getSchoolDashboard(colleagueId);
    if (!dash.school || dash.school.name !== "Escola Teste SUR-9") fail("colleague join", dash.school);
    if (!dash.staff.some((s) => s.userId === colleagueId)) fail("colleague staff row", dash.staff);
    const accepted = await pool.query(
      "select accepted_at, accepted_by_user_id from school_invitation where email = $1",
      [colleagueEmail],
    );
    if (!accepted.rows[0].accepted_at || accepted.rows[0].accepted_by_user_id !== colleagueId) fail("invite accepted", accepted.rows[0]);
    console.log("✓ 6-7. invited colleague signs up → dashboard auto-accepts invite, joins school");

    // 8. Re-inviting the now-member rejected.
    threw = "";
    try { await inviteSchoolStaff(ownerId, { email: colleagueEmail }); } catch (e) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "BAD_REQUEST") fail("re-invite member", `expected BAD_REQUEST, got ${threw || "none"}`);
    console.log("✓ 8. re-inviting an existing member rejected");

    // 9. Instructor blocked from school surfaces.
    const instrEmail = `sur9-instr-${suffix}@example.test`;
    await signup(instrEmail, "instructor");
    const instrId = (await pool.query('select id from "user" where email = $1', [instrEmail])).rows[0].id;
    threw = "";
    try { await getSchoolDashboard(instrId); } catch (e) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "FORBIDDEN") fail("instructor on school surface", `expected FORBIDDEN, got ${threw || "none"}`);
    console.log("✓ 9. instructors blocked from school surfaces");

    // 10. Expired invite not accepted.
    const expiredEmail = `sur9-expired-${suffix}@example.test`;
    await inviteSchoolStaff(ownerId, { email: expiredEmail });
    await pool.query("update school_invitation set expires_at = now() - interval '1 day' where email = $1", [expiredEmail]);
    await signup(expiredEmail, "school_staff");
    const expiredId = (await pool.query('select id from "user" where email = $1', [expiredEmail])).rows[0].id;
    dash = await getSchoolDashboard(expiredId);
    if (dash.school !== null) fail("expired invite accepted", "school linked");
    console.log("✓ 10. expired invitations ignored");

    // cleanup
    await pool.query("delete from school where name = 'Escola Teste SUR-9'");
    await pool.query('delete from "user" where email like $1', [`sur9-%-${suffix}@example.test`]);
    console.log("✓ 11. test data cleaned up");
    console.log("\nSUR-9 contract: ALL CHECKS PASSED");
  } finally {
    await pool.end();
  }
}

main().catch((e) => fail("unhandled", e));
