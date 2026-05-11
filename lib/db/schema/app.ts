import { relations } from "drizzle-orm";
import {
  date,
  foreignKey,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const experienceLevel = pgEnum("experience_level", [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);

export const profileStatus = pgEnum("profile_status", [
  "incomplete",
  "pending_review",
  "active",
  "inactive",
  "suspended",
]);

export const idVerificationStatus = pgEnum("id_verification_status", [
  "not_started",
  "pending",
  "verified",
  "failed",
]);

export const verificationDocumentType = pgEnum("verification_document_type", [
  "certificate",
  "other",
]);

export const verificationDocumentStatus = pgEnum(
  "verification_document_status",
  ["pending", "approved", "rejected", "expired"],
);

export const dayOfWeek = pgEnum("day_of_week", [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
]);

export const bookingStatus = pgEnum("booking_status", [
  "requested",
  "accepted",
  "declined",
  "cancelled",
  "completed",
]);

export const subscriptionSubjectType = pgEnum("subscription_subject_type", [
  "school",
  "instructor",
]);

export const subscriptionStatus = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
]);

export const notificationType = pgEnum("notification_type", [
  "booking_requested",
  "booking_accepted",
  "booking_declined",
  "booking_cancelled",
  "verification_approved",
  "verification_rejected",
]);

const createdAt = timestamp("created_at").defaultNow().notNull();

const updatedAt = timestamp("updated_at")
  .defaultNow()
  .$onUpdate(() => /* @__PURE__ */ new Date())
  .notNull();

export const school = pgTable("school", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  createdAt,
  updatedAt,
});

export const schoolStaff = pgTable(
  "school_staff",
  {
    schoolId: uuid("school_id")
      .notNull()
      .references(() => school.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.schoolId, table.userId] }),
    uniqueIndex("school_staff_user_id_unique").on(table.userId),
  ],
);

export const instructorProfile = pgTable(
  "instructor_profile",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    bio: text("bio"),
    experienceLevel: experienceLevel("experience_level").notNull(),
    profileStatus: profileStatus("profile_status")
      .default("incomplete")
      .notNull(),
    idVerificationProvider: text("id_verification_provider"),
    idVerificationReference: text("id_verification_reference"),
    idVerificationStatus: idVerificationStatus("id_verification_status")
      .default("not_started")
      .notNull(),
    idVerifiedAt: timestamp("id_verified_at"),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("instructor_profile_status_experience_idx").on(
      table.profileStatus,
      table.experienceLevel,
    ),
  ],
);

export const location = pgTable(
  "location",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    region: text("region").notNull(),
    createdAt,
  },
  (table) => [uniqueIndex("location_name_unique").on(table.name)],
);

export const instructorLocation = pgTable(
  "instructor_location",
  {
    instructorId: text("instructor_id")
      .notNull()
      .references(() => instructorProfile.userId, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => location.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.instructorId, table.locationId] }),
    index("instructor_location_location_instructor_idx").on(
      table.locationId,
      table.instructorId,
    ),
  ],
);

export const verificationDocument = pgTable("verification_document", {
  id: uuid("id").defaultRandom().primaryKey(),
  instructorId: text("instructor_id").notNull(),
  docType: verificationDocumentType("doc_type").notNull(),
  storageUrl: text("storage_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewerUserId: text("reviewer_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  status: verificationDocumentStatus("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at"),
  reviewNotes: text("review_notes"),
}, (table) => [
  foreignKey({
    columns: [table.instructorId],
    foreignColumns: [instructorProfile.userId],
    name: "verification_document_instructor_fk",
  }).onDelete("cascade"),
]);

export const instructorAvailability = pgTable(
  "instructor_availability",
  {
    instructorId: text("instructor_id").notNull(),
    dayOfWeek: dayOfWeek("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.instructorId, table.dayOfWeek] }),
    foreignKey({
      columns: [table.instructorId],
      foreignColumns: [instructorProfile.userId],
      name: "instructor_availability_instructor_fk",
    }).onDelete("cascade"),
    index("instructor_availability_instructor_day_idx").on(
      table.instructorId,
      table.dayOfWeek,
    ),
  ],
);

export const booking = pgTable(
  "booking",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    instructorId: text("instructor_id")
      .notNull()
      .references(() => instructorProfile.userId, { onDelete: "restrict" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => school.id, { onDelete: "restrict" }),
    requestedByUserId: text("requested_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    bookingDate: date("booking_date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    status: bookingStatus("status").default("requested").notNull(),
    requestedAt: timestamp("requested_at").defaultNow().notNull(),
    respondedAt: timestamp("responded_at"),
    cancelledAt: timestamp("cancelled_at"),
    notes: text("notes"),
    declineReason: text("decline_reason"),
  },
  (table) => [
    index("booking_instructor_date_status_idx").on(
      table.instructorId,
      table.bookingDate,
      table.status,
    ),
  ],
);

export const schoolInstructorBookmark = pgTable(
  "school_instructor_bookmark",
  {
    schoolId: uuid("school_id")
      .notNull()
      .references(() => school.id, { onDelete: "cascade" }),
    instructorId: text("instructor_id").notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.schoolId, table.instructorId] }),
    foreignKey({
      columns: [table.instructorId],
      foreignColumns: [instructorProfile.userId],
      name: "school_instructor_bookmark_instructor_fk",
    }).onDelete("cascade"),
  ],
);

export const subscription = pgTable("subscription", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectType: subscriptionSubjectType("subject_type").notNull(),
  subjectId: text("subject_id").notNull(),
  plan: text("plan").notNull(),
  status: subscriptionStatus("status").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  canceledAt: timestamp("canceled_at"),
});

export const notification = pgTable("notification", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: notificationType("type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  readAt: timestamp("read_at"),
  createdAt,
});

export const schoolRelations = relations(school, ({ many }) => ({
  staff: many(schoolStaff),
  bookings: many(booking),
  bookmarks: many(schoolInstructorBookmark),
}));

export const schoolStaffRelations = relations(schoolStaff, ({ one }) => ({
  school: one(school, {
    fields: [schoolStaff.schoolId],
    references: [school.id],
  }),
  user: one(user, {
    fields: [schoolStaff.userId],
    references: [user.id],
  }),
}));

export const instructorProfileRelations = relations(
  instructorProfile,
  ({ many, one }) => ({
    user: one(user, {
      fields: [instructorProfile.userId],
      references: [user.id],
    }),
    locations: many(instructorLocation),
    documents: many(verificationDocument),
    availability: many(instructorAvailability),
    bookings: many(booking),
    bookmarks: many(schoolInstructorBookmark),
  }),
);

export const locationRelations = relations(location, ({ many }) => ({
  instructors: many(instructorLocation),
}));

export const instructorLocationRelations = relations(
  instructorLocation,
  ({ one }) => ({
    instructor: one(instructorProfile, {
      fields: [instructorLocation.instructorId],
      references: [instructorProfile.userId],
    }),
    location: one(location, {
      fields: [instructorLocation.locationId],
      references: [location.id],
    }),
  }),
);

export const verificationDocumentRelations = relations(
  verificationDocument,
  ({ one }) => ({
    instructor: one(instructorProfile, {
      fields: [verificationDocument.instructorId],
      references: [instructorProfile.userId],
    }),
    reviewer: one(user, {
      fields: [verificationDocument.reviewerUserId],
      references: [user.id],
    }),
  }),
);

export const instructorAvailabilityRelations = relations(
  instructorAvailability,
  ({ one }) => ({
    instructor: one(instructorProfile, {
      fields: [instructorAvailability.instructorId],
      references: [instructorProfile.userId],
    }),
  }),
);

export const bookingRelations = relations(booking, ({ one }) => ({
  instructor: one(instructorProfile, {
    fields: [booking.instructorId],
    references: [instructorProfile.userId],
  }),
  school: one(school, {
    fields: [booking.schoolId],
    references: [school.id],
  }),
  requestedBy: one(user, {
    fields: [booking.requestedByUserId],
    references: [user.id],
  }),
}));

export const schoolInstructorBookmarkRelations = relations(
  schoolInstructorBookmark,
  ({ one }) => ({
    school: one(school, {
      fields: [schoolInstructorBookmark.schoolId],
      references: [school.id],
    }),
    instructor: one(instructorProfile, {
      fields: [schoolInstructorBookmark.instructorId],
      references: [instructorProfile.userId],
    }),
    createdBy: one(user, {
      fields: [schoolInstructorBookmark.createdByUserId],
      references: [user.id],
    }),
  }),
);

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
}));
