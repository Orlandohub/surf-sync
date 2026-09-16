import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as appSchema from "./schema/app";
import * as authSchema from "./schema/auth";

const globalForDb = globalThis as typeof globalThis & {
  surfSyncPool?: Pool;
};

/**
 * `next build` imports route modules during page-data collection / config
 * extraction, where DATABASE_URL is not guaranteed to be present (CI runs
 * the build with no env at all). During that phase the pool proxy hands out
 * inert stubs: property access succeeds, any actual use fails loudly. At
 * runtime the real pool is created lazily on first use, and a missing
 * DATABASE_URL still fails fast.
 */
const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

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

function inertPoolProperty(): never {
  throw new Error(
    "Database access is not available during `next build`. " +
      "This should only happen at build time; report it if seen at runtime.",
  );
}

export const pool: Pool = new Proxy({} as Pool, {
  get(_target, property, receiver) {
    if (isProductionBuild) {
      return inertPoolProperty;
    }

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
