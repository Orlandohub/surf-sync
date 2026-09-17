// Guard for E2E verify scripts: refuse to seed/modify the SHARED prod DB.
// Local dev and production currently share one Neon database; until they
// are split, any script that creates test data must run against a
// throwaway database pointed to by TEST_DATABASE_URL.
import { loadEnvConfig } from "@next/env";

export function loadTestEnv(): string {
  loadEnvConfig(process.cwd());
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    console.error(
      "\n✗ Refusing to run: TEST_DATABASE_URL is not set.\n" +
        "  This script creates test data and must NOT touch the shared dev/prod database.\n" +
        "  Create a throwaway Neon database, then:\n" +
        "    TEST_DATABASE_URL='postgresql://...' npx tsx scripts/<script>.ts\n",
    );
    process.exit(1);
  }
  return url;
}
