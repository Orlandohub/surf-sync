-- Account type is immutable (Auth PRD P0): set once at signup, never mutated.
-- Application-level guards live in lib/auth/server.ts (databaseHooks); this
-- trigger is the hard database-level backstop required by SUR-15.

CREATE OR REPLACE FUNCTION prevent_user_type_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.type IS DISTINCT FROM OLD.type THEN
    RAISE EXCEPTION 'user.type is immutable'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_type_immutable ON "user";

CREATE TRIGGER user_type_immutable
  BEFORE UPDATE ON "user"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_user_type_change();
