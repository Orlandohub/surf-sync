import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { APIError } from "better-auth/api";
import { db } from "@/lib/db";
import {
  instructorProfile,
  instructorLocation,
  instructorAvailability,
  location,
} from "@/lib/db/schema/app";
import { user } from "@/lib/db/schema/auth";
import { requireInstructor } from "@/lib/services/authz";

/**
 * Instructor onboarding & profile service (SUR-20 + Epic 4 core).
 *
 * Post-scope-change (2026-09-15): no Sumsub, no cert upload, no review
 * queue. The onboarding steps are: verify email → complete profile →
 * set availability. When profile and availability are complete the
 * profile auto-activates (incomplete → active); pause/reactivate flips
 * active ↔ inactive manually.
 */

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Day = (typeof DAYS)[number];

export const EXPERIENCE_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;

export const saveProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  locationIds: z.array(z.string().uuid()).min(1).max(10),
});

export const saveAvailabilitySchema = z.object({
  slots: z
    .array(
      z.object({
        dayOfWeek: z.enum(DAYS),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
      }),
    )
    .max(7), // one slot per day (schema PK: instructor + day)
});

export type OnboardingStep = {
  key: "verify_email" | "complete_profile" | "set_availability";
  done: boolean;
};

export type InstructorOnboarding = {
  emailVerified: boolean;
  hasProfile: boolean;
  hasAvailability: boolean;
  profileStatus: "incomplete" | "pending_review" | "active" | "inactive" | "suspended" | null;
  displayName: string | null;
  steps: OnboardingStep[];
};

/** Everything the onboarding dashboard renders (SUR-20). */
export async function getInstructorOnboarding(
  userId: string,
): Promise<InstructorOnboarding> {
  const instructorId = await requireInstructor(userId);

  const [[u], [profile], availabilityRows] = await Promise.all([
    db
      .select({ emailVerified: user.emailVerified })
      .from(user)
      .where(eq(user.id, instructorId))
      .limit(1),
    db
      .select()
      .from(instructorProfile)
      .where(eq(instructorProfile.userId, instructorId))
      .limit(1),
    db
      .select({ day: instructorAvailability.dayOfWeek })
      .from(instructorAvailability)
      .where(eq(instructorAvailability.instructorId, instructorId))
      .limit(1),
  ]);

  const emailVerified = u?.emailVerified ?? false;
  const hasProfile = Boolean(profile);
  const hasAvailability = availabilityRows.length > 0;

  return {
    emailVerified,
    hasProfile,
    hasAvailability,
    profileStatus: profile?.profileStatus ?? null,
    displayName: profile?.displayName ?? null,
    steps: [
      { key: "verify_email", done: emailVerified },
      { key: "complete_profile", done: hasProfile },
      { key: "set_availability", done: hasAvailability },
    ],
  };
}

export type InstructorProfileInput = z.infer<typeof saveProfileSchema>;

/** Create or update the instructor profile; auto-activate when ready. */
export async function saveInstructorProfile(
  userId: string,
  input: InstructorProfileInput,
): Promise<void> {
  const instructorId = await requireInstructor(userId);

  // Validate locations exist.
  const validLocations = await db
    .select({ id: location.id })
    .from(location)
    .where(inArray(location.id, input.locationIds));
  if (validLocations.length !== input.locationIds.length) {
    throw new APIError("BAD_REQUEST", { message: "Unknown location selected." });
  }

  const existing = await db
    .select({ status: instructorProfile.profileStatus })
    .from(instructorProfile)
    .where(eq(instructorProfile.userId, instructorId))
    .limit(1);

  const hasAvailability = await db
    .select({ day: instructorAvailability.dayOfWeek })
    .from(instructorAvailability)
    .where(eq(instructorAvailability.instructorId, instructorId))
    .limit(1);

  // A paused (inactive) instructor editing their profile stays paused;
  // an incomplete one becomes active once availability also exists.
  const nextStatus =
    existing.length === 0
      ? hasAvailability.length > 0
        ? ("active" as const)
        : ("incomplete" as const)
      : existing[0].status;

  await db
    .insert(instructorProfile)
    .values({
      userId: instructorId,
      displayName: input.displayName,
      bio: input.bio || null,
      experienceLevel: input.experienceLevel,
      profileStatus: nextStatus,
    })
    .onConflictDoUpdate({
      target: instructorProfile.userId,
      set: {
        displayName: input.displayName,
        bio: input.bio || null,
        experienceLevel: input.experienceLevel,
        updatedAt: new Date(),
      },
    });

  // Replace location selections.
  await db
    .delete(instructorLocation)
    .where(eq(instructorLocation.instructorId, instructorId));
  await db.insert(instructorLocation).values(
    input.locationIds.map((locationId) => ({ instructorId, locationId })),
  );
}

export type AvailabilityInput = z.infer<typeof saveAvailabilitySchema>;

/** Replace the weekly availability template; auto-activate when ready. */
export async function saveInstructorAvailability(
  userId: string,
  input: AvailabilityInput,
): Promise<void> {
  const instructorId = await requireInstructor(userId);

  for (const slot of input.slots) {
    if (slot.startTime >= slot.endTime) {
      throw new APIError("BAD_REQUEST", {
        message: `End time must be after start time (${slot.dayOfWeek}).`,
      });
    }
  }

  const [profile] = await db
    .select({ status: instructorProfile.profileStatus })
    .from(instructorProfile)
    .where(eq(instructorProfile.userId, instructorId))
    .limit(1);
  if (!profile) {
    throw new APIError("BAD_REQUEST", {
      message: "Complete your profile before setting availability.",
    });
  }

  await db
    .delete(instructorAvailability)
    .where(eq(instructorAvailability.instructorId, instructorId));
  if (input.slots.length > 0) {
    await db.insert(instructorAvailability).values(
      input.slots.map((s) => ({
        instructorId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    );
  }

  // First availability on an incomplete profile activates it.
  if (profile.status === "incomplete" && input.slots.length > 0) {
    await db
      .update(instructorProfile)
      .set({ profileStatus: "active", updatedAt: new Date() })
      .where(eq(instructorProfile.userId, instructorId));
  }
}

/** Pause (active → inactive) or reactivate (inactive → active). */
export async function setInstructorPaused(
  userId: string,
  paused: boolean,
): Promise<void> {
  const instructorId = await requireInstructor(userId);

  const [profile] = await db
    .select({ status: instructorProfile.profileStatus })
    .from(instructorProfile)
    .where(eq(instructorProfile.userId, instructorId))
    .limit(1);
  if (!profile) {
    throw new APIError("BAD_REQUEST", {
      message: "Complete your profile first.",
    });
  }

  if (paused && profile.status !== "active") {
    throw new APIError("BAD_REQUEST", {
      message: "Only an active profile can be paused.",
    });
  }
  if (!paused) {
    if (profile.status !== "inactive") {
      throw new APIError("BAD_REQUEST", {
        message: "Only a paused profile can be reactivated.",
      });
    }
    // Reactivation requires availability to still exist.
    const rows = await db
      .select({ day: instructorAvailability.dayOfWeek })
      .from(instructorAvailability)
      .where(eq(instructorAvailability.instructorId, instructorId))
      .limit(1);
    if (rows.length === 0) {
      throw new APIError("BAD_REQUEST", {
        message: "Set your availability before reactivating.",
      });
    }
  }

  await db
    .update(instructorProfile)
    .set({ profileStatus: paused ? "inactive" : "active", updatedAt: new Date() })
    .where(and(eq(instructorProfile.userId, instructorId)));
}

/** Profile + locations + availability for the edit forms. */
export async function getInstructorProfileData(userId: string) {
  const instructorId = await requireInstructor(userId);

  const [[profile], myLocations, allLocations, slots] = await Promise.all([
    db
      .select()
      .from(instructorProfile)
      .where(eq(instructorProfile.userId, instructorId))
      .limit(1),
    db
      .select({ locationId: instructorLocation.locationId })
      .from(instructorLocation)
      .where(eq(instructorLocation.instructorId, instructorId)),
    db.select().from(location).orderBy(location.name),
    db
      .select()
      .from(instructorAvailability)
      .where(eq(instructorAvailability.instructorId, instructorId)),
  ]);

  return {
    profile: profile ?? null,
    selectedLocationIds: myLocations.map((l) => l.locationId),
    locations: allLocations,
    availability: slots,
  };
}
