// Epic 6 (SUR-10) E2E verification against a running dev server + real DB.
// Seeds instructors in different states, then exercises search filters,
// the active-only invariant, profile view, and bookmarks.
// Prerequisites: dev server on :3000, locations seeded.
// Run: npx tsx scripts/verify-sur10.ts
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

async function signup(email: string, type: "school_staff" | "instructor") {
  const res = await fetch(`${API}/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ name: `SUR-10 ${type}`, email, password: "password-123", type }),
  });
  if (res.status !== 200) fail(`signup ${email}`, res.status);
}

async function main() {
  const suffix = crypto.randomUUID().slice(0, 8);
  const pool = new pg.Pool({ connectionString: loadTestEnv() });

  const { searchInstructors, getInstructorForSchool, toggleBookmark, getBookmarkedInstructors } =
    await import("../lib/services/discovery");
  const { createSchool } = await import("../lib/services/school");

  // Staff user + school
  const staffEmail = `sur10-staff-${suffix}@example.test`;
  await signup(staffEmail, "school_staff");
  const staffId = (await pool.query('select id from "user" where email = $1', [staffEmail])).rows[0].id;
  await createSchool(staffId, {
    name: `Escola SUR-10 ${suffix}`, description: "", contactEmail: staffEmail,
    contactPhone: "", address: "Rua das Ondas 1", city: "Cascais",
  });

  // Three instructors: active Carcavelos/advanced, active Ericeira/beginner
  // (sat only), and inactive (paused).
  const locs = await pool.query("select id, name from location order by name");
  const locByName = Object.fromEntries(locs.rows.map((r: { name: string; id: string }) => [r.name, r.id]));

  async function seedInstructor(name: string, exp: string, locName: string, days: string[], status: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const email = `sur10-${slug}-${suffix}@example.test`;
    await signup(email, "instructor");
    const id = (await pool.query('select id from "user" where email = $1', [email])).rows[0].id;
    await pool.query(
      "insert into instructor_profile (user_id, display_name, bio, experience_level, profile_status) values ($1,$2,$3,$4,$5)",
      [id, name, `Bio de ${name}.`, exp, status],
    );
    await pool.query("insert into instructor_location (instructor_id, location_id) values ($1,$2)", [id, locByName[locName]]);
    for (const d of days) {
      await pool.query("insert into instructor_availability (instructor_id, day_of_week, start_time, end_time) values ($1,$2,'09:00','17:00')", [id, d]);
    }
    return id;
  }

  try {
    const advId = await seedInstructor("Ana Avancada", "advanced", "Carcavelos", ["mon", "wed", "sat"], "active");
    const begId = await seedInstructor("Bruno Iniciante", "beginner", "Ericeira", ["sat"], "active");
    const pausedId = await seedInstructor("Carlos Pausado", "expert", "Guincho", ["sun"], "inactive");
    console.log("✓ 1. seeded: 2 active + 1 inactive instructors");

    // 2. Unfiltered search: active only.
    let results = await searchInstructors(staffId, {});
    const ids = results.map((r) => r.userId);
    if (!ids.includes(advId) || !ids.includes(begId)) fail("active missing from search", ids);
    if (ids.includes(pausedId)) fail("inactive leaked into search", ids);
    console.log("✓ 2. search returns active instructors only (paused excluded)");

    // 3. Location filter.
    results = await searchInstructors(staffId, { locationId: locByName["Carcavelos"] });
    if (results.length !== 1 || results[0].userId !== advId) fail("location filter", results.map((r) => r.displayName));
    console.log("✓ 3. location filter works");

    // 4. Experience filter.
    results = await searchInstructors(staffId, { experience: "beginner" });
    if (results.length !== 1 || results[0].userId !== begId) fail("experience filter", results.map((r) => r.displayName));
    console.log("✓ 4. experience filter works");

    // 5. Day filter.
    results = await searchInstructors(staffId, { day: "sat" });
    if (results.length !== 2) fail("day filter", results.map((r) => r.displayName));
    results = await searchInstructors(staffId, { day: "mon" });
    if (results.length !== 1 || results[0].userId !== advId) fail("day filter mon", results.map((r) => r.displayName));
    console.log("✓ 5. availability-day filter works");

    // 6. Combined filters.
    results = await searchInstructors(staffId, { locationId: locByName["Ericeira"], day: "sat" });
    if (results.length !== 1 || results[0].userId !== begId) fail("combined filters", results.map((r) => r.displayName));
    console.log("✓ 6. combined filters intersect correctly");

    // 7. Profile view: active OK, inactive NOT_FOUND.
    const detail = await getInstructorForSchool(staffId, advId);
    if (detail.displayName !== "Ana Avancada" || !detail.locations.includes("Carcavelos")) fail("profile detail", detail);
    let threw = "";
    try { await getInstructorForSchool(staffId, pausedId); } catch (e) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "NOT_FOUND") fail("inactive profile view", `expected NOT_FOUND, got ${threw || "none"}`);
    console.log("✓ 7. profile view: active visible, inactive 404");

    // 8. Bookmarks: toggle on/off, school-scoped.
    let bookmarked = await toggleBookmark(staffId, advId);
    if (!bookmarked) fail("bookmark on", bookmarked);
    let marks = await getBookmarkedInstructors(staffId);
    if (marks.length !== 1 || marks[0].userId !== advId) fail("bookmarks list", marks.map((m) => m.displayName));
    bookmarked = await toggleBookmark(staffId, advId);
    if (bookmarked) fail("bookmark off", bookmarked);
    marks = await getBookmarkedInstructors(staffId);
    if (marks.length !== 0) fail("bookmarks after remove", marks.length);
    console.log("✓ 8. bookmarks toggle on/off, school-scoped list");

    // 9. Bookmarking an inactive instructor rejected.
    threw = "";
    try { await toggleBookmark(staffId, pausedId); } catch (e) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "NOT_FOUND") fail("bookmark inactive", `expected NOT_FOUND, got ${threw || "none"}`);
    console.log("✓ 9. bookmarking inactive instructor rejected");

    // 10. Instructors blocked from discovery.
    threw = "";
    try { await searchInstructors(advId, {}); } catch (e) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "FORBIDDEN" && threw !== "UNAUTHORIZED") fail("instructor on discovery", threw);
    console.log("✓ 10. instructors blocked from school discovery");

    // 11. Pages render: /school/discovery guarded for anon.
    const anon = await fetch(`${BASE}/school/discovery`, { redirect: "manual" });
    if (anon.status !== 307 && anon.status !== 302) fail("/school/discovery anon", anon.status);
    console.log("✓ 11. /school/discovery guarded");

    // cleanup
    await pool.query("delete from school where name like $1", [`Escola SUR-10 ${suffix}`]);
    await pool.query('delete from "user" where email like $1', [`sur10-%-${suffix}@example.test`]);
    console.log("✓ 12. test data cleaned up");
    console.log("\nSUR-10 contract: ALL CHECKS PASSED");
  } finally {
    await pool.end();
  }
}

main().catch((e) => fail("unhandled", e));
