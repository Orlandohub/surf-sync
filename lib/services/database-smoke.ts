import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { account, session, user, verification } from "@/lib/db/schema/auth";
import {
  booking,
  instructorAvailability,
  instructorLocation,
  instructorProfile,
  location,
  notification,
  school,
  schoolInstructorBookmark,
  schoolStaff,
  subscription,
  verificationDocument,
} from "@/lib/db/schema/app";

const smokeRollbackMessage = "SURFSYNC_DATABASE_SMOKE_ROLLBACK";

export async function readMvpTableCounts() {
  const result = await db.execute<{ table_name: string; row_count: string }>(
    sql`
      select table_name, row_count::text
      from (
        values
          ('user', (select count(*) from "user")),
          ('session', (select count(*) from "session")),
          ('account', (select count(*) from "account")),
          ('verification', (select count(*) from "verification")),
          ('school', (select count(*) from "school")),
          ('school_staff', (select count(*) from "school_staff")),
          ('instructor_profile', (select count(*) from "instructor_profile")),
          ('location', (select count(*) from "location")),
          ('instructor_location', (select count(*) from "instructor_location")),
          ('verification_document', (select count(*) from "verification_document")),
          ('instructor_availability', (select count(*) from "instructor_availability")),
          ('booking', (select count(*) from "booking")),
          ('school_instructor_bookmark', (select count(*) from "school_instructor_bookmark")),
          ('subscription', (select count(*) from "subscription")),
          ('notification', (select count(*) from "notification"))
      ) as counts(table_name, row_count)
      order by table_name;
    `,
  );

  return result.rows.map((row) => ({
    tableName: row.table_name,
    rowCount: Number(row.row_count),
  }));
}

export async function verifyMvpSchemaReadWrite() {
  try {
    await db.transaction(async (tx) => {
      const suffix = crypto.randomUUID();
      const schoolUserId = `school-user-${suffix}`;
      const instructorUserId = `instructor-user-${suffix}`;
      const smokeLocationId = crypto.randomUUID();
      const smokeSchoolId = crypto.randomUUID();
      const now = new Date();

      await tx.insert(user).values([
        {
          id: schoolUserId,
          name: "Smoke School Staff",
          email: `school-${suffix}@example.test`,
          type: "school_staff",
        },
        {
          id: instructorUserId,
          name: "Smoke Instructor",
          email: `instructor-${suffix}@example.test`,
          type: "instructor",
        },
      ]);

      await tx.insert(session).values({
        id: `session-${suffix}`,
        token: `token-${suffix}`,
        userId: schoolUserId,
        expiresAt: new Date(now.getTime() + 60_000),
      });

      await tx.insert(account).values({
        id: `account-${suffix}`,
        accountId: schoolUserId,
        providerId: "credential",
        userId: schoolUserId,
      });

      await tx.insert(verification).values({
        id: `verification-${suffix}`,
        identifier: `verify-${suffix}`,
        value: `value-${suffix}`,
        expiresAt: new Date(now.getTime() + 60_000),
      });

      await tx.insert(school).values({
        id: smokeSchoolId,
        name: "Smoke School",
        contactEmail: `school-${suffix}@example.test`,
        address: "Smoke Address",
        city: "Cascais",
      });

      await tx.insert(schoolStaff).values({
        schoolId: smokeSchoolId,
        userId: schoolUserId,
      });

      await tx.insert(instructorProfile).values({
        userId: instructorUserId,
        displayName: "Smoke Instructor",
        experienceLevel: "intermediate",
      });

      await tx.insert(location).values({
        id: smokeLocationId,
        name: `Smoke Location ${suffix}`,
        region: "Smoke Region",
      });

      await tx.insert(instructorLocation).values({
        instructorId: instructorUserId,
        locationId: smokeLocationId,
      });

      await tx.insert(verificationDocument).values({
        instructorId: instructorUserId,
        docType: "certificate",
        storageUrl: `smoke://${suffix}`,
      });

      await tx.insert(instructorAvailability).values({
        instructorId: instructorUserId,
        dayOfWeek: "mon",
        startTime: "09:00",
        endTime: "17:00",
      });

      await tx.insert(booking).values({
        instructorId: instructorUserId,
        schoolId: smokeSchoolId,
        requestedByUserId: schoolUserId,
        bookingDate: "2026-01-05",
        startTime: "10:00",
        endTime: "12:00",
      });

      await tx.insert(schoolInstructorBookmark).values({
        schoolId: smokeSchoolId,
        instructorId: instructorUserId,
        createdByUserId: schoolUserId,
      });

      await tx.insert(subscription).values({
        subjectType: "instructor",
        subjectId: instructorUserId,
        plan: "early_access",
        status: "trialing",
      });

      await tx.insert(notification).values({
        userId: instructorUserId,
        type: "booking_requested",
        payload: { source: "database-smoke" },
      });

      await tx.select().from(user).limit(1);
      await tx.select().from(session).limit(1);
      await tx.select().from(account).limit(1);
      await tx.select().from(verification).limit(1);
      await tx.select().from(school).limit(1);
      await tx.select().from(schoolStaff).limit(1);
      await tx.select().from(instructorProfile).limit(1);
      await tx.select().from(location).limit(1);
      await tx.select().from(instructorLocation).limit(1);
      await tx.select().from(verificationDocument).limit(1);
      await tx.select().from(instructorAvailability).limit(1);
      await tx.select().from(booking).limit(1);
      await tx.select().from(schoolInstructorBookmark).limit(1);
      await tx.select().from(subscription).limit(1);
      await tx.select().from(notification).limit(1);

      throw new Error(smokeRollbackMessage);
    });
  } catch (error) {
    if (error instanceof Error && error.message === smokeRollbackMessage) {
      return;
    }

    throw error;
  }
}
