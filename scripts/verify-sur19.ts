// SUR-19 E2E verification against a running dev server + real DB.
// Exercises lib/services/authz guards with real users of both types.
// Prerequisites: dev server on :3000. No emails involved.
// Run: npx tsx scripts/verify-sur19.ts
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

async function signUpUser(email: string, type: "school_staff" | "instructor") {
  const res = await fetch(`${API}/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ name: `SUR-19 ${type}`, email, password: "password-123", type }),
  });
  if (res.status !== 200) fail(`signup ${type}`, res.status);
}

async function main() {
  const suffix = crypto.randomUUID().slice(0, 8);
  const staffEmail = `sur19-staff-${suffix}@example.test`;
  const instrEmail = `sur19-instr-${suffix}@example.test`;
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  // Import the guards AFTER env is loaded (they touch the DB at call time).
  const { requireSchoolId, requireInstructor, assertSchoolAccess, assertInstructorSelf } =
    await import("../lib/services/authz");

  try {
    await signUpUser(staffEmail, "school_staff");
    await signUpUser(instrEmail, "instructor");
    const staffId = (await pool.query('select id from "user" where email = $1', [staffEmail])).rows[0].id;
    const instrId = (await pool.query('select id from "user" where email = $1', [instrEmail])).rows[0].id;
    console.log("✓ 1. staff + instructor users created");

    // 2. requireSchoolId: staff without a school linkage → FORBIDDEN.
    let threw = "";
    try { await requireSchoolId(staffId); } catch (e: unknown) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "FORBIDDEN") fail("unlinked staff requireSchoolId", `expected FORBIDDEN, got ${threw || "no throw"}`);
    console.log("✓ 2. staff without school linkage → FORBIDDEN (no school access)");

    // 3. Link the staff user to a school, then requireSchoolId resolves it.
    const schoolId = crypto.randomUUID();
    await pool.query('insert into school (id, name, contact_email, address, city) values ($1, $2, $3, $4, $5)',
      [schoolId, "SUR-19 Surf School", "school@sur19.test", "Rua do Mar 1", "Lisboa"]);
    await pool.query("insert into school_staff (school_id, user_id) values ($1, $2)", [schoolId, staffId]);
    const resolved = await requireSchoolId(staffId);
    if (resolved !== schoolId) fail("requireSchoolId resolve", resolved);
    console.log("✓ 3. linked staff → requireSchoolId resolves their school");

    // 4. assertSchoolAccess: own school passes; another school FORBIDDENs.
    const otherSchool = crypto.randomUUID();
    await pool.query('insert into school (id, name, contact_email, address, city) values ($1, $2, $3, $4, $5)',
      [otherSchool, "Other School", "other@sur19.test", "Rua X", "Cascais"]);
    threw = "";
    try { await assertSchoolAccess(staffId, otherSchool); } catch (e: unknown) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "FORBIDDEN") fail("cross-school access", `expected FORBIDDEN, got ${threw || "no throw"}`);
    await assertSchoolAccess(staffId, schoolId); // must not throw
    console.log("✓ 4. assertSchoolAccess: own school OK, cross-school → 403");

    // 5. Type separation: instructor can't touch school surfaces and vice versa.
    threw = "";
    try { await requireSchoolId(instrId); } catch (e: unknown) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "FORBIDDEN") fail("instructor on school surface", `expected FORBIDDEN, got ${threw || "no throw"}`);
    threw = "";
    try { await requireInstructor(staffId); } catch (e: unknown) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "FORBIDDEN") fail("staff on instructor surface", `expected FORBIDDEN, got ${threw || "no throw"}`);
    console.log("✓ 5. type separation enforced both directions (FORBIDDEN)");

    // 6. assertInstructorSelf: own id passes; another user's id FORBIDDENs.
    await assertInstructorSelf(instrId, instrId);
    threw = "";
    try { await assertInstructorSelf(instrId, staffId); } catch (e: unknown) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "FORBIDDEN") fail("instructor cross-self", `expected FORBIDDEN, got ${threw || "no throw"}`);
    console.log("✓ 6. assertInstructorSelf: self OK, other user → 403");

    // 7. Unknown user → UNAUTHORIZED (401).
    threw = "";
    try { await requireSchoolId("nonexistent-user"); } catch (e: unknown) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "UNAUTHORIZED") fail("unknown user", `expected UNAUTHORIZED, got ${threw || "no throw"}`);
    console.log("✓ 7. unknown user → UNAUTHORIZED");

    // cleanup
    await pool.query("delete from school where id in ($1, $2)", [schoolId, otherSchool]);
    await pool.query('delete from "user" where email like $1', [`sur19-%-${suffix}@example.test`]);
    console.log("✓ 8. test data cleaned up");
    console.log("\nSUR-19 contract: ALL CHECKS PASSED");
  } finally {
    await pool.end();
  }
}

main().catch((e) => fail("unhandled", e));
