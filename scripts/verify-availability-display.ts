// Verify availability slots (with times) reach the school-facing profile.
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
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Seed: staff+school, instructor with sat 09:00–13:00.
    const mk = async (email: string, type: "school_staff" | "instructor") => {
      const res = await fetch(`${API}/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: BASE },
        body: JSON.stringify({ name: `Avail ${type}`, email, password: "password-123", type }),
      });
      if (res.status !== 200) fail(`signup ${email}`, res.status);
      return (await pool.query('select id from "user" where email = $1', [email])).rows[0].id;
    };
    const staffId = await mk(`avail-staff-${suffix}@example.test`, "school_staff");
    const instrId = await mk(`avail-instr-${suffix}@example.test`, "instructor");
    const { createSchool } = await import("../lib/services/school");
    await createSchool(staffId, {
      name: `Escola Avail ${suffix}`, description: "", contactEmail: "a@b.test",
      contactPhone: "", address: "Rua 1", city: "Lisboa",
    });
    await pool.query(
      "insert into instructor_profile (user_id, display_name, experience_level, profile_status) values ($1,'Teste Horas','advanced','active')",
      [instrId],
    );
    await pool.query(
      "insert into instructor_availability (instructor_id, day_of_week, start_time, end_time) values ($1,'sat','09:00','13:00')",
      [instrId],
    );

    // 1. Service returns slots with times.
    const { getInstructorForSchool } = await import("../lib/services/discovery");
    const detail = await getInstructorForSchool(staffId, instrId);
    if (detail.availabilitySlots.length !== 1) fail("slots", detail.availabilitySlots);
    const slot = detail.availabilitySlots[0];
    if (slot.day !== "sat" || String(slot.startTime).slice(0, 5) !== "09:00" || String(slot.endTime).slice(0, 5) !== "13:00") {
      fail("slot times", slot);
    }
    console.log("✓ 1. profile detail carries sat 09:00–13:00");

    // 2. Page renders day + time.
    const signin = await fetch(`${API}/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email: `avail-staff-${suffix}@example.test`, password: "password-123" }),
    });
    const cookie = signin.headers.get("set-cookie")?.split(";")[0] ?? "";
    const page = await fetch(`${BASE}/school/discovery/${instrId}`, { headers: { Cookie: cookie } });
    const html = await page.text();
    if (!html.includes("Sábado") || !html.includes("09:00") || !html.includes("13:00")) {
      fail("page render", "day or time range missing");
    }
    console.log("✓ 2. profile page renders 'Sábado · 09:00–13:00'");

    // cleanup
    await pool.query('delete from "user" where email like $1', [`avail-%-${suffix}@example.test`]);
    await pool.query("delete from school where name like $1", [`Escola Avail ${suffix}`]);
    console.log("✓ 3. cleaned up");
    console.log("\nAvailability display: VERIFIED");
  } finally {
    await pool.end();
  }
}
main();
