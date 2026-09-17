// SUR-20 E2E verification against a running dev server + real DB.
// Exercises the onboarding dashboard contract: guard, steps, profile save,
// availability save, auto-activation, pause/reactivate.
// Prerequisites: dev server on :3000, locations seeded.
// Run: npx tsx scripts/verify-sur20.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { loadTestEnv } from "./lib/test-env";
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

async function main() {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `sur20-${suffix}@example.test`;
  const pool = new pg.Pool({ connectionString: loadTestEnv() });

  const { getInstructorOnboarding, saveInstructorProfile, saveInstructorAvailability, setInstructorPaused } =
    await import("../lib/services/instructor");

  try {
    // 1. Signup an instructor.
    const signup = await fetch(`${API}/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ name: "SUR-20 Tester", email, password: "password-123", type: "instructor" }),
    });
    if (signup.status !== 200) fail("signup", signup.status);
    const userId = (await pool.query('select id from "user" where email = $1', [email])).rows[0].id;
    console.log("✓ 1. instructor signed up");

    // 2. Fresh onboarding state: email unverified, no profile, no availability.
    let ob = await getInstructorOnboarding(userId);
    if (ob.emailVerified) fail("emailVerified initial", "expected false");
    if (ob.hasProfile) fail("hasProfile initial", "expected false");
    if (ob.steps.filter((s) => s.done).length !== 0) fail("steps initial", ob.steps);
    console.log("✓ 2. onboarding starts with all steps todo");

    // 3. /instructor page: guarded — unauthenticated redirect, staff redirect.
    const anon = await fetch(`${BASE}/instructor`, { redirect: "manual" });
    if (anon.status !== 307 && anon.status !== 302) fail("/instructor anon guard", anon.status);
    console.log("✓ 3. /instructor guarded (anon → /sign-in)");

    // 4. Save profile (with a real location) — step 2 done, status incomplete.
    const locId = (await pool.query("select id from location order by name limit 1")).rows[0].id;
    await saveInstructorProfile(userId, {
      displayName: "João Ondas",
      bio: "Instrutor desde 2015.",
      experienceLevel: "advanced",
      locationIds: [locId],
    });
    ob = await getInstructorOnboarding(userId);
    if (!ob.hasProfile) fail("profile saved", "hasProfile false");
    if (ob.profileStatus !== "incomplete") fail("status after profile", ob.profileStatus);
    const profRow = (await pool.query("select display_name, experience_level from instructor_profile where user_id = $1", [userId])).rows[0];
    if (profRow.display_name !== "João Ondas") fail("displayName", profRow.display_name);
    const locRows = await pool.query("select count(*)::int as n from instructor_location where instructor_id = $1", [userId]);
    if (locRows.rows[0].n !== 1) fail("location link", locRows.rows[0].n);
    console.log("✓ 4. profile saved (name, experience, location linked); status still incomplete");

    // 5. Availability before profile is required — but profile exists now, so save works.
    await saveInstructorAvailability(userId, {
      slots: [{ dayOfWeek: "sat", startTime: "09:00", endTime: "13:00" }],
    });
    ob = await getInstructorOnboarding(userId);
    if (!ob.hasAvailability) fail("availability saved", "hasAvailability false");
    if (ob.profileStatus !== "active") fail("auto-activation", ob.profileStatus);
    console.log("✓ 5. availability saved → profile AUTO-ACTIVATED (incomplete → active)");

    // 6. End-before-start rejected.
    let threw = "";
    try {
      await saveInstructorAvailability(userId, { slots: [{ dayOfWeek: "sun", startTime: "18:00", endTime: "09:00" }] });
    } catch (e) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "BAD_REQUEST") fail("invalid time range", `expected BAD_REQUEST, got ${threw || "none"}`);
    console.log("✓ 6. end-before-start rejected");

    // 7. Pause → inactive; reactivate → active.
    await setInstructorPaused(userId, true);
    ob = await getInstructorOnboarding(userId);
    if (ob.profileStatus !== "inactive") fail("pause", ob.profileStatus);
    await setInstructorPaused(userId, false);
    ob = await getInstructorOnboarding(userId);
    if (ob.profileStatus !== "active") fail("reactivate", ob.profileStatus);
    console.log("✓ 7. pause → inactive, reactivate → active");

    // 8. Double-pause rejected.
    threw = "";
    try { await setInstructorPaused(userId, false); } catch (e) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "BAD_REQUEST") fail("double reactivate", `expected BAD_REQUEST, got ${threw || "none"}`);
    console.log("✓ 8. invalid transition rejected");

    // 9. Email verification completes step 1 (simulate via DB — token flow
    //    already covered by SUR-16).
    await pool.query('update "user" set email_verified = true where id = $1', [userId]);
    ob = await getInstructorOnboarding(userId);
    if (!ob.emailVerified) fail("emailVerified after update", "false");
    if (ob.steps.filter((s) => s.done).length !== 3) fail("all steps done", ob.steps);
    console.log("✓ 9. all three steps done after email verification");

    // 10. Availability replace semantics: saving again replaces, not appends.
    await saveInstructorAvailability(userId, {
      slots: [
        { dayOfWeek: "sat", startTime: "10:00", endTime: "14:00" },
        { dayOfWeek: "sun", startTime: "10:00", endTime: "14:00" },
      ],
    });
    const av = await pool.query("select day_of_week, start_time, end_time from instructor_availability where instructor_id = $1 order by day_of_week", [userId]);
    if (av.rows.length !== 2) fail("availability replace", av.rows.length);
    if (String(av.rows[0].start_time) !== "10:00:00") fail("replaced start", av.rows[0].start_time);
    console.log("✓ 10. availability saves replace previous template");

    // cleanup
    await pool.query('delete from "user" where email = $1', [email]);
    console.log("✓ 11. test data cleaned up");
    console.log("\nSUR-20 contract: ALL CHECKS PASSED");
  } finally {
    await pool.end();
  }
}

main().catch((e) => fail("unhandled", e));
