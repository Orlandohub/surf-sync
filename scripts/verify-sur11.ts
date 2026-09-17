// M4 (SUR-11+12) E2E verification against a running dev server + real DB.
// Full booking lifecycle: request → notify → accept/decline → cancel (both
// sides) + conflict/availability/guard checks + notification reads.
// Prerequisites: dev server on :3000, locations seeded.
// Run: npx tsx scripts/verify-sur11.ts
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
    body: JSON.stringify({ name: `M4 ${type}`, email, password: "password-123", type }),
  });
  if (res.status !== 200) fail(`signup ${email}`, res.status);
}

function localDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextSaturday(weeksAhead = 0) {
  const d = new Date();
  const add = (6 - d.getDay() + 7) % 7 || 7; // next Saturday, never today
  d.setDate(d.getDate() + add + weeksAhead * 7);
  // Local date parts — toISOString() would shift the day at UTC offsets.
  return localDateStr(d);
}

async function main() {
  const suffix = crypto.randomUUID().slice(0, 8);
  const pool = new pg.Pool({ connectionString: loadTestEnv() });

  const { requestBooking, respondToBooking, cancelBooking, listSchoolBookings, listInstructorBookings } =
    await import("../lib/services/booking");
  const { listNotifications, unreadCount, markAllNotificationsRead } =
    await import("../lib/services/notifications");
  const { createSchool } = await import("../lib/services/school");

  const staffEmail = `m4-staff-${suffix}@example.test`;
  const instrEmail = `m4-instr-${suffix}@example.test`;
  await signup(staffEmail, "school_staff");
  await signup(instrEmail, "instructor");
  const staffId = (await pool.query('select id from "user" where email = $1', [staffEmail])).rows[0].id;
  const instrId = (await pool.query('select id from "user" where email = $1', [instrEmail])).rows[0].id;
  await createSchool(staffId, {
    name: `Escola M4 ${suffix}`, description: "", contactEmail: staffEmail,
    contactPhone: "", address: "Av. do Mar 3", city: "Lisboa",
  });
  await pool.query(
    "insert into instructor_profile (user_id, display_name, bio, experience_level, profile_status) values ($1,'Marta Mar','Bio','advanced','active')",
    [instrId],
  );
  await pool.query(
    "insert into instructor_availability (instructor_id, day_of_week, start_time, end_time) values ($1,'sat','09:00','13:00')",
    [instrId],
  );
  const sat = nextSaturday();

  async function statusOf(bookingId: string) {
    const r = await pool.query("select status from booking where id = $1", [bookingId]);
    return r.rows[0]?.status;
  }

  try {
    console.log("✓ 1. school + active instructor (sat 09:00–13:00) seeded");

    // 2. Request inside availability → OK + instructor notified.
    let threw = "";
    const bookingId = await requestBooking(staffId, {
      instructorId: instrId, bookingDate: sat, startTime: "10:00", endTime: "12:00", notes: "Primeira aula",
    });
    if ((await statusOf(bookingId)) !== "requested") fail("initial status", await statusOf(bookingId));
    let notifs = await listNotifications(instrId);
    if (!notifs.some((n) => n.type === "booking_requested")) fail("instructor notified", notifs.map((n) => n.type));
    console.log("✓ 2. request created (requested) + instructor notification row");

    // 3. Outside availability rejected.
    threw = "";
    try {
      await requestBooking(staffId, { instructorId: instrId, bookingDate: sat, startTime: "14:00", endTime: "16:00" });
    } catch (e) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "BAD_REQUEST") fail("outside availability", `expected BAD_REQUEST, got ${threw || "none"}`);
    console.log("✓ 3. slot outside weekly availability rejected");

    // 4. Overlapping request rejected (conflict with requested booking).
    threw = "";
    try {
      await requestBooking(staffId, { instructorId: instrId, bookingDate: sat, startTime: "11:00", endTime: "13:00" });
    } catch (e) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "CONFLICT") fail("overlap", `expected CONFLICT, got ${threw || "none"}`);
    console.log("✓ 4. overlapping slot rejected (CONFLICT)");

    // 5. Accept → school notified, status accepted.
    await respondToBooking(instrId, bookingId, true);
    if ((await statusOf(bookingId)) !== "accepted") fail("after accept", await statusOf(bookingId));
    notifs = await listNotifications(staffId);
    if (!notifs.some((n) => n.type === "booking_accepted")) fail("school notified on accept", notifs.map((n) => n.type));
    console.log("✓ 5. accept → status accepted + school notification");

    // 6. Double-respond rejected.
    threw = "";
    try { await respondToBooking(instrId, bookingId, true); } catch (e) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "BAD_REQUEST") fail("double respond", `expected BAD_REQUEST, got ${threw || "none"}`);
    console.log("✓ 6. double-respond rejected");

    // 7. Decline flow: second booking (a week later) → decline with reason.
    const satNext = nextSaturday(1);
    const booking2 = await requestBooking(staffId, {
      instructorId: instrId, bookingDate: satNext, startTime: "09:00", endTime: "10:00",
    });
    await respondToBooking(instrId, booking2, false, "Tenho aula nesse horário.");
    if ((await statusOf(booking2)) !== "declined") fail("after decline", await statusOf(booking2));
    const declined = await listSchoolBookings(staffId);
    if (!declined.some((b) => b.id === booking2 && b.declineReason === "Tenho aula nesse horário.")) {
      fail("decline reason surfaced", declined.find((b) => b.id === booking2));
    }
    notifs = await listNotifications(staffId);
    if (!notifs.some((n) => n.type === "booking_declined")) fail("decline notification", "missing");
    console.log("✓ 7. decline with reason → school sees reason + notification");

    // 8. Cancellation by school (accepted booking).
    await cancelBooking(staffId, bookingId);
    if ((await statusOf(bookingId)) !== "cancelled") fail("after school cancel", await statusOf(bookingId));
    notifs = await listNotifications(instrId);
    if (!notifs.some((n) => n.type === "booking_cancelled")) fail("cancel notification", "missing");
    console.log("✓ 8. school cancels accepted booking → instructor notified");

    // 9. Cancel a cancelled booking rejected.
    threw = "";
    try { await cancelBooking(staffId, bookingId); } catch (e) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "BAD_REQUEST") fail("double cancel", `expected BAD_REQUEST, got ${threw || "none"}`);
    console.log("✓ 9. cancelling a terminal booking rejected");

    // 10. Instructor cancels their own request; school-side cancel of
    //     another school's booking forbidden (cross-school guard).
    const booking3 = await requestBooking(staffId, {
      instructorId: instrId, bookingDate: satNext, startTime: "11:00", endTime: "12:00",
    });
    await cancelBooking(instrId, booking3);
    if ((await statusOf(booking3)) !== "cancelled") fail("instructor cancel", await statusOf(booking3));
    console.log("✓ 10. instructor-side cancellation works");

    // 11. Unauthorized user cannot cancel.
    const outsiderEmail = `m4-out-${suffix}@example.test`;
    await signup(outsiderEmail, "school_staff"); // staff with NO school
    const outsiderId = (await pool.query('select id from "user" where email = $1', [outsiderEmail])).rows[0].id;
    const booking4 = await requestBooking(staffId, {
      instructorId: instrId, bookingDate: satNext, startTime: "12:00", endTime: "13:00",
    });
    threw = "";
    try { await cancelBooking(outsiderId, booking4); } catch (e) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "FORBIDDEN" && threw !== "BAD_REQUEST") fail("outsider cancel", `got ${threw || "none"}`);
    if ((await statusOf(booking4)) !== "requested") fail("outsider changed state", await statusOf(booking4));
    console.log("✓ 11. unrelated user cannot cancel — state intact");

    // 12. Notifications: unread count + mark-all.
    const unreadBefore = await unreadCount(staffId);
    if (unreadBefore < 2) fail("unread count", unreadBefore);
    await markAllNotificationsRead(staffId);
    const unreadAfter = await unreadCount(staffId);
    if (unreadAfter !== 0) fail("mark all read", unreadAfter);
    console.log("✓ 12. unread counting + mark-all-read");

    // 13. Both list views scoped.
    const schoolList = await listSchoolBookings(staffId);
    const instrList = await listInstructorBookings(instrId);
    if (schoolList.length !== 4) fail("school list count", schoolList.length);
    if (instrList.length !== 4) fail("instructor list count", instrList.length);
    if (!schoolList.every((b) => b.schoolName === `Escola M4 ${suffix}`)) fail("school list scope", "foreign booking");
    console.log("✓ 13. both sides list their bookings, school-scoped");

    // 14. Booking an inactive instructor rejected.
    await pool.query("update instructor_profile set profile_status = 'inactive' where user_id = $1", [instrId]);
    threw = "";
    try {
      await requestBooking(staffId, { instructorId: instrId, bookingDate: satNext, startTime: "12:30", endTime: "13:00" });
    } catch (e) { threw = String((e as { status?: string }).status ?? ""); }
    if (threw !== "NOT_FOUND") fail("inactive instructor booking", `expected NOT_FOUND, got ${threw || "none"}`);
    console.log("✓ 14. booking an inactive instructor rejected");

    // cleanup (bookings first — school delete is restricted by booking FK)
    await pool.query("delete from booking where instructor_id = $1", [instrId]);
    await pool.query("delete from school where name like $1", [`Escola M4 ${suffix}`]);
    await pool.query("delete from instructor_profile where user_id = $1", [instrId]);
    await pool.query('delete from "user" where email like $1', [`m4-%-${suffix}@example.test`]);
    console.log("✓ 15. test data cleaned up");
    console.log("\nM4 contract (SUR-11 + SUR-12): ALL CHECKS PASSED");
  } finally {
    await pool.end();
  }
}

main().catch((e) => fail("unhandled", e));
