import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { instructorProfile, schoolStaff } from "@/lib/db/schema/app";

/**
 * Read-only lookups for the school screens (UI overhaul). No business
 * rules, no writes: the guards and state changes stay in school.ts,
 * discovery.ts and booking.ts.
 */

/**
 * The school a school_staff user belongs to, or null while they haven't
 * created or joined one yet (the "Criar escola" state). Lets pages send a
 * brand-new school account back to /school instead of failing on
 * requireSchoolId.
 */
export async function findSchoolIdForUser(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ schoolId: schoolStaff.schoolId })
    .from(schoolStaff)
    .where(eq(schoolStaff.userId, userId))
    .limit(1);
  return row?.schoolId ?? null;
}

/**
 * Which of these instructors passed identity verification (Sumsub), for
 * the verified mark next to their name. Returns the verified ids.
 */
export async function listVerifiedInstructorIds(
  instructorIds: readonly string[],
): Promise<string[]> {
  if (instructorIds.length === 0) return [];
  const rows = await db
    .select({ userId: instructorProfile.userId })
    .from(instructorProfile)
    .where(
      and(
        inArray(instructorProfile.userId, [...instructorIds]),
        eq(instructorProfile.idVerificationStatus, "verified"),
      ),
    );
  return rows.map((r) => r.userId);
}
