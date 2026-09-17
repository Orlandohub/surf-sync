import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { APIError } from "better-auth/api";
import { db } from "@/lib/db";
import { booking, instructorProfile, school } from "@/lib/db/schema/app";
import { user } from "@/lib/db/schema/auth";
import { requireSchoolId, requireInstructor } from "@/lib/services/authz";
import { notifyBookingEvent } from "@/lib/services/notifications";

/**
 * Booking flow service (Epic 7).
 *
 * State machine: requested → accepted | declined (terminal) ;
 * requested/accepted → cancelled (terminal, either side).
 * `completed` is reserved for M5 operational tooling.
 *
 * Rules:
 * - Only a linked school can request; only active instructors can be
 *   booked; the slot must fall inside the instructor's weekly
 *   availability for that weekday.
 * - No overlap with the same instructor's other accepted/requested
 *   bookings on that date.
 * - Every event notifies the other side (in-app + email).
 */

const DAY_BY_INDEX = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export const requestBookingSchema = z.object({
  instructorId: z.string().min(1),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type BookingView = {
  id: string;
  instructorId: string;
  instructorName: string;
  schoolId: string;
  schoolName: string;
  requestedByName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: "requested" | "accepted" | "declined" | "cancelled" | "completed";
  notes: string | null;
  declineReason: string | null;
  requestedAt: Date;
  respondedAt: Date | null;
  cancelledAt: Date | null;
};

/** School requests a booking. Returns the created booking id. */
export async function requestBooking(
  userId: string,
  input: z.infer<typeof requestBookingSchema>,
): Promise<string> {
  const schoolId = await requireSchoolId(userId);

  if (input.startTime >= input.endTime) {
    throw new APIError("BAD_REQUEST", { message: "A hora de fim tem de ser depois do início." });
  }
  const date = new Date(`${input.bookingDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
    throw new APIError("BAD_REQUEST", { message: "Data inválida ou no passado." });
  }

  const [instructor] = await db
    .select({
      id: instructorProfile.userId,
      status: instructorProfile.profileStatus,
      displayName: instructorProfile.displayName,
    })
    .from(instructorProfile)
    .where(eq(instructorProfile.userId, input.instructorId))
    .limit(1);
  if (!instructor || instructor.status !== "active") {
    throw new APIError("NOT_FOUND", { message: "Instrutor não disponível." });
  }

  // Slot must sit inside the instructor's weekly availability for that weekday.
  const weekday = DAY_BY_INDEX[date.getUTCDay()];
  const { instructorAvailability } = await import("@/lib/db/schema/app");
  const slots = await db
    .select()
    .from(instructorAvailability)
    .where(
      and(
        eq(instructorAvailability.instructorId, input.instructorId),
        eq(instructorAvailability.dayOfWeek, weekday),
      ),
    );
  const insideAvailability = slots.some(
    (s) =>
      input.startTime >= s.startTime.slice(0, 5) &&
      input.endTime <= s.endTime.slice(0, 5),
  );
  if (!insideAvailability) {
    throw new APIError("BAD_REQUEST", {
      message: "Fora da disponibilidade semanal do instrutor para esse dia.",
    });
  }

  // No overlap with existing active (requested/accepted) bookings.
  const existing = await db
    .select({ startTime: booking.startTime, endTime: booking.endTime })
    .from(booking)
    .where(
      and(
        eq(booking.instructorId, input.instructorId),
        eq(booking.bookingDate, input.bookingDate),
        ne(booking.status, "declined"),
        ne(booking.status, "cancelled"),
      ),
    );
  const overlaps = existing.some(
    (b) =>
      input.startTime < b.endTime.slice(0, 5) &&
      b.startTime.slice(0, 5) < input.endTime,
  );
  if (overlaps) {
    throw new APIError("CONFLICT", { message: "O instrutor já tem reserva nesse horário." });
  }

  const [requester] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  const [schoolRow] = await db
    .select({ name: school.name })
    .from(school)
    .where(eq(school.id, schoolId))
    .limit(1);

  const [created] = await db
    .insert(booking)
    .values({
      instructorId: input.instructorId,
      schoolId,
      requestedByUserId: userId,
      bookingDate: input.bookingDate,
      startTime: input.startTime,
      endTime: input.endTime,
      notes: input.notes || null,
    })
    .returning({ id: booking.id });

  const [instructorUser] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, input.instructorId))
    .limit(1);

  await notifyBookingEvent(instructor.id, instructorUser.email, "booking_requested", {
    bookingId: created.id,
    instructorName: instructor.displayName,
    schoolName: schoolRow.name,
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    endTime: input.endTime,
    byUserName: requester.name,
  });

  return created.id;
}

/** Instructor accepts or declines a pending request. */
export async function respondToBooking(
  userId: string,
  bookingId: string,
  accept: boolean,
  declineReason?: string,
): Promise<void> {
  const instructorId = await requireInstructor(userId);

  const [row] = await db.select().from(booking).where(eq(booking.id, bookingId)).limit(1);
  if (!row || row.instructorId !== instructorId) {
    throw new APIError("NOT_FOUND", { message: "Reserva não encontrada." });
  }
  if (row.status !== "requested") {
    throw new APIError("BAD_REQUEST", { message: "Este pedido já foi respondido." });
  }

  await db
    .update(booking)
    .set({
      status: accept ? "accepted" : "declined",
      respondedAt: new Date(),
      declineReason: accept ? null : declineReason?.slice(0, 500) || null,
    })
    .where(eq(booking.id, bookingId));

  // Notify the requester (the staff member who made the request).
  const [requester] = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, row.requestedByUserId))
    .limit(1);
  const [schoolRow] = await db
    .select({ name: school.name })
    .from(school)
    .where(eq(school.id, row.schoolId))
    .limit(1);
  const [instructorRow] = await db
    .select({ displayName: instructorProfile.displayName })
    .from(instructorProfile)
    .where(eq(instructorProfile.userId, instructorId))
    .limit(1);

  await notifyBookingEvent(row.requestedByUserId, requester.email, accept ? "booking_accepted" : "booking_declined", {
    bookingId,
    instructorName: instructorRow.displayName,
    schoolName: schoolRow.name,
    bookingDate: row.bookingDate,
    startTime: row.startTime,
    endTime: row.endTime,
    declineReason: accept ? undefined : declineReason,
  });
}

/** Either side cancels a requested/accepted booking. */
export async function cancelBooking(userId: string, bookingId: string): Promise<void> {
  const [row] = await db.select().from(booking).where(eq(booking.id, bookingId)).limit(1);
  if (!row) {
    throw new APIError("NOT_FOUND", { message: "Reserva não encontrada." });
  }
  if (row.status !== "requested" && row.status !== "accepted") {
    throw new APIError("BAD_REQUEST", { message: "Esta reserva já não pode ser cancelada." });
  }

  // Authorization: the instructor who owns it, or any staff of the school.
  const [u] = await db
    .select({ type: user.type })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!u) throw new APIError("UNAUTHORIZED", { message: "Sessão expirada." });

  let isSchoolSide = false;
  if (u.type === "school_staff") {
    const schoolId = await requireSchoolId(userId);
    isSchoolSide = schoolId === row.schoolId;
  }
  const isInstructorSide = u.type === "instructor" && row.instructorId === userId;
  if (!isSchoolSide && !isInstructorSide) {
    throw new APIError("FORBIDDEN", { message: "Sem permissão sobre esta reserva." });
  }

  await db
    .update(booking)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(eq(booking.id, bookingId));

  // Notify the other side.
  const [instructorRow] = await db
    .select({ displayName: instructorProfile.displayName })
    .from(instructorProfile)
    .where(eq(instructorProfile.userId, row.instructorId))
    .limit(1);
  const [schoolRow] = await db
    .select({ name: school.name })
    .from(school)
    .where(eq(school.id, row.schoolId))
    .limit(1);
  const [canceller] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const payload = {
    bookingId,
    instructorName: instructorRow.displayName,
    schoolName: schoolRow.name,
    bookingDate: row.bookingDate,
    startTime: row.startTime,
    endTime: row.endTime,
    byUserName: canceller.name,
  };

  if (isSchoolSide) {
    const [instructorUser] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, row.instructorId))
      .limit(1);
    await notifyBookingEvent(row.instructorId, instructorUser.email, "booking_cancelled", payload);
  } else {
    const [requester] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, row.requestedByUserId))
      .limit(1);
    await notifyBookingEvent(row.requestedByUserId, requester.email, "booking_cancelled", payload);
  }
}

/** Bookings visible to the calling school. */
export async function listSchoolBookings(userId: string): Promise<BookingView[]> {
  const schoolId = await requireSchoolId(userId);
  return baseBookingQuery()
    .where(eq(booking.schoolId, schoolId))
    .orderBy(desc(booking.requestedAt));
}

/** Bookings visible to the calling instructor. */
export async function listInstructorBookings(userId: string): Promise<BookingView[]> {
  const instructorId = await requireInstructor(userId);
  return baseBookingQuery()
    .where(eq(booking.instructorId, instructorId))
    .orderBy(desc(booking.requestedAt));
}

function baseBookingQuery() {
  return db
    .select({
      id: booking.id,
      instructorId: booking.instructorId,
      instructorName: instructorProfile.displayName,
      schoolId: booking.schoolId,
      schoolName: school.name,
      requestedByName: user.name,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      notes: booking.notes,
      declineReason: booking.declineReason,
      requestedAt: booking.requestedAt,
      respondedAt: booking.respondedAt,
      cancelledAt: booking.cancelledAt,
    })
    .from(booking)
    .innerJoin(instructorProfile, eq(instructorProfile.userId, booking.instructorId))
    .innerJoin(school, eq(school.id, booking.schoolId))
    .innerJoin(user, eq(user.id, booking.requestedByUserId));
}
