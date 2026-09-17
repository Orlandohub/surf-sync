import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { APIError } from "better-auth/api";
import { db } from "@/lib/db";
import {
  instructorProfile,
  instructorLocation,
  instructorAvailability,
  location,
  schoolInstructorBookmark,
} from "@/lib/db/schema/app";
import { requireSchoolId } from "@/lib/services/authz";
import { EXPERIENCE_LEVELS } from "@/lib/services/instructor";

/**
 * Discovery & search service (Epic 6 / SUR-10).
 *
 * School-facing, read-only marketplace: search active instructor
 * profiles by location / experience / weekday availability, view a
 * profile, and bookmark instructors (per school, any staff member).
 * All queries are scoped by requireSchoolId — a school only ever sees
 * its own bookmarks.
 */

export const searchSchema = z.object({
  locationId: z.string().uuid().optional(),
  experience: z.enum(EXPERIENCE_LEVELS).optional(),
  day: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]).optional(),
});

export type SearchFilters = z.infer<typeof searchSchema>;

export type InstructorCard = {
  userId: string;
  displayName: string;
  bio: string | null;
  experienceLevel: (typeof EXPERIENCE_LEVELS)[number];
  locations: string[];
  availableDays: string[];
  bookmarked: boolean;
};

/** Search active instructors. Active-only is the marketplace invariant. */
export async function searchInstructors(
  userId: string,
  filters: SearchFilters,
): Promise<InstructorCard[]> {
  await requireSchoolId(userId); // any staff member of a linked school

  const conditions = [eq(instructorProfile.profileStatus, "active")];
  if (filters.experience) {
    conditions.push(eq(instructorProfile.experienceLevel, filters.experience));
  }
  if (filters.locationId) {
    const rows = await db
      .select({ instructorId: instructorLocation.instructorId })
      .from(instructorLocation)
      .where(eq(instructorLocation.locationId, filters.locationId));
    const ids = rows.map((r) => r.instructorId);
    if (ids.length === 0) return [];
    conditions.push(inArray(instructorProfile.userId, ids));
  }
  if (filters.day) {
    const rows = await db
      .select({ instructorId: instructorAvailability.instructorId })
      .from(instructorAvailability)
      .where(eq(instructorAvailability.dayOfWeek, filters.day));
    const ids = rows.map((r) => r.instructorId);
    if (ids.length === 0) return [];
    conditions.push(inArray(instructorProfile.userId, ids));
  }

  const profiles = await db
    .select()
    .from(instructorProfile)
    .where(and(...conditions))
    .orderBy(asc(instructorProfile.displayName));

  if (profiles.length === 0) return [];
  const ids = profiles.map((p) => p.userId);

  const [locRows, availRows, bookmarkRows] = await Promise.all([
    db
      .select({ instructorId: instructorLocation.instructorId, name: location.name })
      .from(instructorLocation)
      .innerJoin(location, eq(location.id, instructorLocation.locationId))
      .where(inArray(instructorLocation.instructorId, ids)),
    db
      .select({
        instructorId: instructorAvailability.instructorId,
        day: instructorAvailability.dayOfWeek,
      })
      .from(instructorAvailability)
      .where(inArray(instructorAvailability.instructorId, ids)),
    db
      .select({ instructorId: schoolInstructorBookmark.instructorId })
      .from(schoolInstructorBookmark)
      .where(
        eq(
          schoolInstructorBookmark.schoolId,
          sql`(select school_id from school_staff where user_id = ${userId})`,
        ),
      ),
  ]);

  const bookmarked = new Set(bookmarkRows.map((b) => b.instructorId));

  return profiles.map((p) => ({
    userId: p.userId,
    displayName: p.displayName,
    bio: p.bio,
    experienceLevel: p.experienceLevel,
    locations: locRows.filter((l) => l.instructorId === p.userId).map((l) => l.name),
    availableDays: availRows.filter((a) => a.instructorId === p.userId).map((a) => a.day),
    bookmarked: bookmarked.has(p.userId),
  }));
}

export type InstructorDetail = InstructorCard & {
  email: string | null;
};

/** Full profile view for a school. Active instructors only. */
export async function getInstructorForSchool(
  userId: string,
  instructorId: string,
): Promise<InstructorDetail> {
  await requireSchoolId(userId);

  const [profile] = await db
    .select()
    .from(instructorProfile)
    .where(
      and(
        eq(instructorProfile.userId, instructorId),
        eq(instructorProfile.profileStatus, "active"),
      ),
    )
    .limit(1);
  if (!profile) {
    throw new APIError("NOT_FOUND", { message: "Instrutor não encontrado." });
  }

  const cards = await searchInstructors(userId, {});
  const card = cards.find((c) => c.userId === instructorId);
  if (!card) {
    throw new APIError("NOT_FOUND", { message: "Instrutor não encontrado." });
  }

  // Contact email is only exposed on the profile detail view.
  return { ...card, email: null };
}

/** Toggle a bookmark for the caller's school. Returns the new state. */
export async function toggleBookmark(
  userId: string,
  instructorId: string,
): Promise<boolean> {
  const schoolId = await requireSchoolId(userId);

  const [target] = await db
    .select({ status: instructorProfile.profileStatus })
    .from(instructorProfile)
    .where(eq(instructorProfile.userId, instructorId))
    .limit(1);
  if (!target || target.status !== "active") {
    throw new APIError("NOT_FOUND", { message: "Instrutor não encontrado." });
  }

  const [existing] = await db
    .select({ instructorId: schoolInstructorBookmark.instructorId })
    .from(schoolInstructorBookmark)
    .where(
      and(
        eq(schoolInstructorBookmark.schoolId, schoolId),
        eq(schoolInstructorBookmark.instructorId, instructorId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .delete(schoolInstructorBookmark)
      .where(
        and(
          eq(schoolInstructorBookmark.schoolId, schoolId),
          eq(schoolInstructorBookmark.instructorId, instructorId),
        ),
      );
    return false;
  }

  await db.insert(schoolInstructorBookmark).values({
    schoolId,
    instructorId,
    createdByUserId: userId,
  });
  return true;
}

/** Bookmarked instructors for the caller's school. */
export async function getBookmarkedInstructors(
  userId: string,
): Promise<InstructorCard[]> {
  const schoolId = await requireSchoolId(userId);

  const rows = await db
    .select({ instructorId: schoolInstructorBookmark.instructorId })
    .from(schoolInstructorBookmark)
    .where(eq(schoolInstructorBookmark.schoolId, schoolId));
  if (rows.length === 0) return [];

  const cards = await searchInstructors(userId, {});
  const bookmarkedIds = new Set(rows.map((r) => r.instructorId));
  // A bookmarked instructor who paused keeps their bookmark but drops
  // from active search — keep them visible in the bookmarks list only
  // while active (consistent with the marketplace invariant).
  return cards.filter((c) => bookmarkedIds.has(c.userId));
}

/** All locations, for the filter dropdown. */
export async function listLocations(): Promise<
  { id: string; name: string; region: string }[]
> {
  return db.select().from(location).orderBy(asc(location.name));
}
