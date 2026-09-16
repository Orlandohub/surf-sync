// One-off verification for SUR-15: applies the user.type immutability trigger
// directly (bypassing drizzle-kit to surface the real PG error if any) and
// reports applied migrations. Run: npx tsx scripts/apply-type-trigger.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { createRequire } from "node:module";

const require = createRequire(process.cwd() + "/");
const pg = require("pg");

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const fn = `
CREATE OR REPLACE FUNCTION prevent_user_type_change()
RETURNS trigger AS $fn$
BEGIN
  IF NEW.type IS DISTINCT FROM OLD.type THEN
    RAISE EXCEPTION 'user.type is immutable' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;`;
  const trg = `DROP TRIGGER IF EXISTS user_type_immutable ON "user";
CREATE TRIGGER user_type_immutable BEFORE UPDATE ON "user"
  FOR EACH ROW EXECUTE FUNCTION prevent_user_type_change();`;
  try {
    await pool.query(fn);
    await pool.query(trg);
    const t = await pool.query(
      "select tgname from pg_trigger where tgname='user_type_immutable'",
    );
    console.log("TRIGGER OK:", t.rows.length > 0);
    const m = await pool.query(
      "select hash, created_at from drizzle.__drizzle_migrations order by created_at",
    );
    for (const r of m.rows)
      console.log("migration:", r.hash.slice(0, 10), r.created_at?.toISOString?.());
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
