// Applies pending drizzle migrations to the dev DB (which was historically
// push-synced, so drizzle-kit migrate can't journal it). If the 0000 baseline
// objects already exist, records it as applied first, then runs the rest.
// npx tsx scripts/apply-dev-db.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { createRequire } from "node:module";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import crypto from "node:crypto";
const require = createRequire(process.cwd() + "/");
const pg = require("pg");

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query("create schema if not exists drizzle");
  await pool.query(`create table if not exists drizzle.__drizzle_migrations (
    hash text primary key, created_at bigint)`);

  const applied = new Set(
    (await pool.query("select hash from drizzle.__drizzle_migrations"))
      .rows.map((r: { hash: string }) => r.hash),
  );

  // If the full baseline schema already exists (push-synced history), mark
  // 0000 as applied so only genuinely pending migrations run.
  const baselineExists = async () => {
    const r = await pool.query(
      `select count(*)::int as n from information_schema.tables
       where table_schema='public' and table_name in
       ('user','session','account','verification','school','booking','notification','instructor_profile')`,
    );
    return r.rows[0].n === 8;
  };

  const files = readdirSync("drizzle").filter(f => f.endsWith(".sql")).sort();
  for (const f of files) {
    const sql = readFileSync(join("drizzle", f), "utf8");
    const hash = crypto.createHash("sha256").update(sql).digest("hex");
    if (applied.has(hash)) { console.log("skip (applied):", f); continue; }

    if (f.startsWith("0000") && (await baselineExists())) {
      await pool.query(
        "insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2) on conflict do nothing",
        [hash, Date.now()],
      );
      console.log("baseline recorded as applied (schema already present):", f);
      continue;
    }

    const stmts = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);
    for (const s of stmts) {
      // Idempotency for custom trigger SQL (CREATE TRIGGER lacks IF EXISTS)
      if (s.includes("CREATE TRIGGER") && !s.includes("DROP TRIGGER")) {
        const m = s.match(/CREATE TRIGGER (\w+)/);
        if (m) await pool.query(`drop trigger if exists ${m[1]} on "user"`).catch(() => {});
      }
      await pool.query(s);
    }
    await pool.query("insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)", [hash, Date.now()]);
    console.log("applied:", f);
  }
  await pool.end();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
