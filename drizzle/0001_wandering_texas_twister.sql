CREATE TABLE "verification_email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "verification_email_log_email_sent_idx" ON "verification_email_log" USING btree ("email","sent_at");
--> statement-breakpoint
-- Account type is immutable (Auth PRD P0): set once at signup, never mutated.
-- Application-level guards live in lib/auth/server.ts (databaseHooks); this
-- trigger is the hard database-level backstop required by SUR-15.

CREATE OR REPLACE FUNCTION prevent_user_type_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.type IS DISTINCT FROM OLD.type THEN
    RAISE EXCEPTION 'user.type is immutable'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER user_type_immutable
  BEFORE UPDATE ON "user"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_user_type_change();
