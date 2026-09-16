import { eq } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { db } from "@/lib/db";
import { schoolStaff, instructorProfile } from "@/lib/db/schema/app";
import { user } from "@/lib/db/schema/auth";

/**
 * Service-layer authorization guards (SUR-19, per Auth PRD P0).
 *
 * Convention (see docs/architecture/service-layer.md):
 * - Transport layers (Server Actions / Route Handlers) authenticate the
 *   caller and check the user TYPE.
 * - Service layers enforce DATA SCOPE with these helpers: school data is
 *   constrained to the caller's school via SchoolStaff; instructor data
 *   is gated to the caller's own userId.
 * - Services never read headers/cookies themselves; they take a userId.
 */

export type UserType = "school_staff" | "instructor";

async function getUser(userId: string) {
  const [row] = await db
    .select({ id: user.id, type: user.type })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row ?? null;
}

/**
 * Resolve the school a school_staff user belongs to. Throws UNAUTHORIZED
 * if the user doesn't exist and FORBIDDEN if they aren't school staff
 * (or have no school linkage yet).
 */
export async function requireSchoolId(userId: string): Promise<string> {
  const u = await getUser(userId);
  if (!u) {
    throw new APIError("UNAUTHORIZED", { message: "Not signed in." });
  }
  if (u.type !== "school_staff") {
    throw new APIError("FORBIDDEN", {
      message: "Only school accounts can access school data.",
    });
  }
  const [staff] = await db
    .select({ schoolId: schoolStaff.schoolId })
    .from(schoolStaff)
    .where(eq(schoolStaff.userId, userId))
    .limit(1);
  if (!staff) {
    throw new APIError("FORBIDDEN", {
      message: "No school is linked to this account yet.",
    });
  }
  return staff.schoolId;
}

/**
 * Require that the caller is an instructor. Instructor data is always
 * scoped to the caller's own userId — callers pass it to downstream
 * queries; this helper only gates the surface.
 */
export async function requireInstructor(userId: string): Promise<string> {
  const u = await getUser(userId);
  if (!u) {
    throw new APIError("UNAUTHORIZED", { message: "Not signed in." });
  }
  if (u.type !== "instructor") {
    throw new APIError("FORBIDDEN", {
      message: "Only instructor accounts can access instructor surfaces.",
    });
  }
  return u.id;
}

/**
 * Cross-access guard: when school-scoped queries need to touch a specific
 * school's row, constrain by the caller's resolved school id. Returns the
 * schoolId if it matches, FORBIDDEN otherwise — use in where-clauses as
 * `eq(school.id, await assertSchoolAccess(userId, requestedSchoolId))`.
 */
export async function assertSchoolAccess(
  userId: string,
  requestedSchoolId: string,
): Promise<string> {
  const schoolId = await requireSchoolId(userId);
  if (schoolId !== requestedSchoolId) {
    throw new APIError("FORBIDDEN", {
      message: "This school does not belong to your account.",
    });
  }
  return schoolId;
}

/**
 * Instructor self-access guard: instructor data is readable/writable only
 * by its owner. Use as `eq(instructorProfile.userId, await assertInstructorSelf(userId, requestedUserId))`.
 */
export async function assertInstructorSelf(
  userId: string,
  requestedUserId: string,
): Promise<string> {
  const id = await requireInstructor(userId);
  if (id !== requestedUserId) {
    throw new APIError("FORBIDDEN", {
      message: "Instructor data is only accessible to its owner.",
    });
  }
  return id;
}

/**
 * Ensure an instructor profile row exists for the user (read guard for
 * instructor surfaces that assume a profile).
 */
export async function requireInstructorProfile(userId: string) {
  const id = await requireInstructor(userId);
  const [profile] = await db
    .select()
    .from(instructorProfile)
    .where(eq(instructorProfile.userId, id))
    .limit(1);
  if (!profile) {
    throw new APIError("FORBIDDEN", {
      message: "Instructor profile not found for this account.",
    });
  }
  return profile;
}
