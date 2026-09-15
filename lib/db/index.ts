import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as appSchema from "./schema/app";
import * as authSchema from "./schema/auth";

const globalForDb = globalThis as typeof globalThis & {
  surfSyncPool?: Pool;
};

/**
 * `next build` evaluates route modules during page-data collection, where
 * DATABASE_URL is not guaranteed to be present. The real pool is therefore
 * created lazily on first use; during the build phase nothing connects.
 */
function getPool(): Pool {
  if (!globalForDb.surfSyncPool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is required to initialize the database.");
    }

    globalForDb.surfSyncPool = new Pool({ connectionString });
  }

  return globalForDb.surfSyncPool;
}

export const pool: Pool = new Proxy({} as Pool, {
  get(_target, property, receiver) {
    const realPool = getPool();
    const value = Reflect.get(realPool, property, receiver);
    return typeof value === "function" ? value.bind(realPool) : value;
  },
});

export const schema = {
  ...authSchema,
  ...appSchema,
};

export const db = drizzle(pool, { schema });
