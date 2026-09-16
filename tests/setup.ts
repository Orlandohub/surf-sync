// Vitest setup: load Next.js env files so db-backed modules import cleanly.
// The pool is lazy — tests that never touch the DB never connect.
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
