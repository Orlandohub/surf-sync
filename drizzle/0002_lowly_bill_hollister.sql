CREATE TABLE "school_invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"invited_by_user_id" text NOT NULL,
	"accepted_at" timestamp,
	"accepted_by_user_id" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "school_invitation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "school_invitation" ADD CONSTRAINT "school_invitation_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_invitation" ADD CONSTRAINT "school_invitation_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_invitation" ADD CONSTRAINT "school_invitation_accepted_by_user_id_user_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "school_invitation_school_email_idx" ON "school_invitation" USING btree ("school_id","email");--> statement-breakpoint
CREATE INDEX "school_invitation_email_pending_idx" ON "school_invitation" USING btree ("email","accepted_at");