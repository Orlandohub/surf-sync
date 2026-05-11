import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as appSchema from "./schema/app";
import * as authSchema from "./schema/auth";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to initialize the database.");
}

const globalForDb = globalThis as typeof globalThis & {
  surfSyncPool?: Pool;
};

export const pool =
  globalForDb.surfSyncPool ?? new Pool({ connectionString });

if (process.env.NODE_ENV !== "production") {
  globalForDb.surfSyncPool = pool;
}

export const schema = {
  ...authSchema,
  ...appSchema,
};

export const db = drizzle(pool, { schema });
