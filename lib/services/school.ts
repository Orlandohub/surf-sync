import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { APIError } from "better-auth/api";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { school, schoolStaff, schoolInvitation } from "@/lib/db/schema/app";
import { user } from "@/lib/db/schema/auth";
import { requireSchoolId } from "@/lib/services/authz";

/**
 * School onboarding & multi-staff service (Epic 5 / SUR-9).
 *
 * Model: the first school_staff user creates the school and is linked as
 * staff. Additional staff are invited by email; when an invited address
 * signs up as school_staff and visits /school, the pending invitation is
 * accepted automatically (staff row created). No roles — every staff
 * member is equal (per the epic's "no roles" scope).
 */

export const createSchoolSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  contactEmail: z.string().email(),
  contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().min(4).max(240),
  city: z.string().trim().min(2).max(80),
});

export const inviteStaffSchema = z.object({
  email: z.string().email(),
});

export type SchoolDashboardData = {
  school:
    | {
        id: string;
        name: string;
        description: string | null;
        contactEmail: string;
        contactPhone: string | null;
        address: string;
        city: string;
      }
    | null;
  staff: { userId: string; name: string; email: string; joinedAt: Date }[];
  pendingInvites: { email: string; invitedAt: Date; expiresAt: Date }[];
};

/**
 * School dashboard data for a school_staff caller. Accepts any pending
 * invitation for the caller's email first (idempotent: skip if already
 * linked to a school).
 */
export async function getSchoolDashboard(
  userId: string,
): Promise<SchoolDashboardData> {
  // requireSchoolId throws if not staff / not linked — but the dashboard
  // must render for unlinked staff too (create-school state), so probe
  // membership directly.
  const [u] = await db
    .select({ id: user.id, type: user.type, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!u) throw new APIError("UNAUTHORIZED", { message: "Sessão expirada. Inicie sessão novamente." });
  if (u.type !== "school_staff") {
    throw new APIError("FORBIDDEN", { message: "Esta área é reservada a contas de escola." });
  }

  const [link] = await db
    .select({ schoolId: schoolStaff.schoolId })
    .from(schoolStaff)
    .where(eq(schoolStaff.userId, userId))
    .limit(1);

  if (!link) {
    // Accept any pending invitation for this email (7-day expiry).
    await acceptPendingInvitation(userId, u.email);
    const [linked] = await db
      .select({ schoolId: schoolStaff.schoolId })
      .from(schoolStaff)
      .where(eq(schoolStaff.userId, userId))
      .limit(1);
    if (!linked) {
      return { school: null, staff: [], pendingInvites: [] };
    }
    return loadSchool(linked.schoolId);
  }
  return loadSchool(link.schoolId);
}

async function loadSchool(schoolId: string): Promise<SchoolDashboardData> {
  const [[s], staff, invites] = await Promise.all([
    db.select().from(school).where(eq(school.id, schoolId)).limit(1),
    db
      .select({
        userId: schoolStaff.userId,
        name: user.name,
        email: user.email,
        joinedAt: schoolStaff.createdAt,
      })
      .from(schoolStaff)
      .innerJoin(user, eq(user.id, schoolStaff.userId))
      .where(eq(schoolStaff.schoolId, schoolId))
      .orderBy(schoolStaff.createdAt),
    db
      .select({
        email: schoolInvitation.email,
        invitedAt: schoolInvitation.createdAt,
        expiresAt: schoolInvitation.expiresAt,
      })
      .from(schoolInvitation)
      .where(
        and(
          eq(schoolInvitation.schoolId, schoolId),
          isNull(schoolInvitation.acceptedAt),
        ),
      )
      .orderBy(desc(schoolInvitation.createdAt)),
  ]);

  const now = Date.now();
  return {
    school: s ?? null,
    staff,
    pendingInvites: invites.filter((i) => i.expiresAt.getTime() > now),
  };
}

/** Create the school and link the caller as first staff member. */
export async function createSchool(
  userId: string,
  input: z.infer<typeof createSchoolSchema>,
): Promise<string> {
  // requireSchoolId would throw (no school yet) — check type directly.
  const [u] = await db
    .select({ type: user.type })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!u) throw new APIError("UNAUTHORIZED", { message: "Sessão expirada. Inicie sessão novamente." });
  if (u.type !== "school_staff") {
    throw new APIError("FORBIDDEN", { message: "Only school accounts create schools." });
  }

  const [existing] = await db
    .select({ schoolId: schoolStaff.schoolId })
    .from(schoolStaff)
    .where(eq(schoolStaff.userId, userId))
    .limit(1);
  if (existing) {
    throw new APIError("BAD_REQUEST", { message: "Já pertence a uma escola." });
  }

  const [created] = await db
    .insert(school)
    .values({
      name: input.name,
      description: input.description || null,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone || null,
      address: input.address,
      city: input.city,
    })
    .returning({ id: school.id });

  await db.insert(schoolStaff).values({ schoolId: created.id, userId });
  return created.id;
}

/** Invite a colleague by email. Caller must belong to the school.
 *  Returns the school name (for the invitation email). */
export async function inviteSchoolStaff(
  userId: string,
  input: z.infer<typeof inviteStaffSchema>,
): Promise<string> {
  const schoolId = await requireSchoolId(userId);
  const email = input.email.toLowerCase();

  const [invitedUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (invitedUser) {
    const [alreadyStaff] = await db
      .select({ userId: schoolStaff.userId })
      .from(schoolStaff)
      .where(eq(schoolStaff.userId, invitedUser.id))
      .limit(1);
    if (alreadyStaff) {
      throw new APIError("BAD_REQUEST", {
        message: "Essa pessoa já pertence a uma escola.",
      });
    }
  }

  // One pending invite per (school, email): replace previous pending.
  await db
    .delete(schoolInvitation)
    .where(
      and(
        eq(schoolInvitation.schoolId, schoolId),
        eq(schoolInvitation.email, email),
        isNull(schoolInvitation.acceptedAt),
      ),
    );

  const token = crypto.randomUUID();
  await db.insert(schoolInvitation).values({
    schoolId,
    email,
    token,
    invitedByUserId: userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const [s] = await db
    .select({ name: school.name })
    .from(school)
    .where(eq(school.id, schoolId))
    .limit(1);
  return s?.name ?? "";
}

/**
 * Link a user to the school of their pending invitation (called from the
 * dashboard when an unlinked school_staff user visits).
 */
export async function acceptPendingInvitation(
  userId: string,
  email: string,
): Promise<void> {
  const [invite] = await db
    .select()
    .from(schoolInvitation)
    .where(
      and(
        eq(schoolInvitation.email, email.toLowerCase()),
        isNull(schoolInvitation.acceptedAt),
      ),
    )
    .orderBy(desc(schoolInvitation.createdAt))
    .limit(1);

  if (!invite || invite.expiresAt.getTime() < Date.now()) return;

  const [alreadyLinked] = await db
    .select({ schoolId: schoolStaff.schoolId })
    .from(schoolStaff)
    .where(eq(schoolStaff.userId, userId))
    .limit(1);
  if (alreadyLinked) return;

  await db.insert(schoolStaff).values({ schoolId: invite.schoolId, userId });
  await db
    .update(schoolInvitation)
    .set({ acceptedAt: new Date(), acceptedByUserId: userId })
    .where(eq(schoolInvitation.id, invite.id));
}

/** Resolve a school name for the invitation email (by invite token). */
export async function getSchoolNameForInviteToken(
  token: string,
): Promise<string | null> {
  const [row] = await db
    .select({ name: school.name })
    .from(schoolInvitation)
    .innerJoin(school, eq(school.id, schoolInvitation.schoolId))
    .where(
      and(
        eq(schoolInvitation.token, token),
        isNull(schoolInvitation.acceptedAt),
      ),
    )
    .limit(1);
  return row?.name ?? null;
}
