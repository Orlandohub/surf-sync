CREATE TYPE "public"."booking_status" AS ENUM('requested', 'accepted', 'declined', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."day_of_week" AS ENUM('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');--> statement-breakpoint
CREATE TYPE "public"."experience_level" AS ENUM('beginner', 'intermediate', 'advanced', 'expert');--> statement-breakpoint
CREATE TYPE "public"."id_verification_status" AS ENUM('not_started', 'pending', 'verified', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('booking_requested', 'booking_accepted', 'booking_declined', 'booking_cancelled', 'verification_approved', 'verification_rejected');--> statement-breakpoint
CREATE TYPE "public"."profile_status" AS ENUM('incomplete', 'pending_review', 'active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."subscription_subject_type" AS ENUM('school', 'instructor');--> statement-breakpoint
CREATE TYPE "public"."verification_document_status" AS ENUM('pending', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."verification_document_type" AS ENUM('certificate', 'other');--> statement-breakpoint
CREATE TABLE "booking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instructor_id" text NOT NULL,
	"school_id" uuid NOT NULL,
	"requested_by_user_id" text NOT NULL,
	"booking_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"status" "booking_status" DEFAULT 'requested' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"cancelled_at" timestamp,
	"notes" text,
	"decline_reason" text
);
--> statement-breakpoint
CREATE TABLE "instructor_availability" (
	"instructor_id" text NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	CONSTRAINT "instructor_availability_instructor_id_day_of_week_pk" PRIMARY KEY("instructor_id","day_of_week")
);
--> statement-breakpoint
CREATE TABLE "instructor_location" (
	"instructor_id" text NOT NULL,
	"location_id" uuid NOT NULL,
	CONSTRAINT "instructor_location_instructor_id_location_id_pk" PRIMARY KEY("instructor_id","location_id")
);
--> statement-breakpoint
CREATE TABLE "instructor_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"bio" text,
	"experience_level" "experience_level" NOT NULL,
	"profile_status" "profile_status" DEFAULT 'incomplete' NOT NULL,
	"id_verification_provider" text,
	"id_verification_reference" text,
	"id_verification_status" "id_verification_status" DEFAULT 'not_started' NOT NULL,
	"id_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_instructor_bookmark" (
	"school_id" uuid NOT NULL,
	"instructor_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "school_instructor_bookmark_school_id_instructor_id_pk" PRIMARY KEY("school_id","instructor_id")
);
--> statement-breakpoint
CREATE TABLE "school_staff" (
	"school_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "school_staff_school_id_user_id_pk" PRIMARY KEY("school_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" "subscription_subject_type" NOT NULL,
	"subject_id" text NOT NULL,
	"plan" text NOT NULL,
	"status" "subscription_status" NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"current_period_end" timestamp,
	"canceled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "verification_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instructor_id" text NOT NULL,
	"doc_type" "verification_document_type" NOT NULL,
	"storage_url" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewer_user_id" text,
	"status" "verification_document_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp,
	"review_notes" text
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"type" text DEFAULT 'school_staff' NOT NULL,
	"phone" text,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_instructor_id_instructor_profile_user_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructor_profile"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_requested_by_user_id_user_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_availability" ADD CONSTRAINT "instructor_availability_instructor_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructor_profile"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_location" ADD CONSTRAINT "instructor_location_instructor_id_instructor_profile_user_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructor_profile"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_location" ADD CONSTRAINT "instructor_location_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_profile" ADD CONSTRAINT "instructor_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_instructor_bookmark" ADD CONSTRAINT "school_instructor_bookmark_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_instructor_bookmark" ADD CONSTRAINT "school_instructor_bookmark_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_instructor_bookmark" ADD CONSTRAINT "school_instructor_bookmark_instructor_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructor_profile"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_staff" ADD CONSTRAINT "school_staff_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_staff" ADD CONSTRAINT "school_staff_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_document" ADD CONSTRAINT "verification_document_reviewer_user_id_user_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_document" ADD CONSTRAINT "verification_document_instructor_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructor_profile"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_instructor_date_status_idx" ON "booking" USING btree ("instructor_id","booking_date","status");--> statement-breakpoint
CREATE INDEX "instructor_availability_instructor_day_idx" ON "instructor_availability" USING btree ("instructor_id","day_of_week");--> statement-breakpoint
CREATE INDEX "instructor_location_location_instructor_idx" ON "instructor_location" USING btree ("location_id","instructor_id");--> statement-breakpoint
CREATE INDEX "instructor_profile_status_experience_idx" ON "instructor_profile" USING btree ("profile_status","experience_level");--> statement-breakpoint
CREATE UNIQUE INDEX "location_name_unique" ON "location" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "school_staff_user_id_unique" ON "school_staff" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");