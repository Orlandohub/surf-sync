// Applies scripts/seed-locations.sql to the DATABASE_URL database.
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(process.cwd() + "/");
const pg = require("pg");

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const sql = readFileSync(join(process.cwd(), "scripts", "seed-locations.sql"), "utf8");
  const res = await pool.query(sql);
  console.log("locations seeded:", res.rowCount ?? 0, "rows affected");
  const { rows } = await pool.query("select count(*)::int as n from location");
  console.log("total locations:", rows[0].n);
  await pool.end();
}
main();
