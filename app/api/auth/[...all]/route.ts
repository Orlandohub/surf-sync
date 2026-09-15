import { auth } from "@/lib/auth/server";
import { toNextJsHandler } from "better-auth/next-js";

// Never evaluate or prerender this handler at build time. Better Auth's
// handler initializes the database at module scope, and DATABASE_URL is not
// present in the build container (env vars are runtime-only on Vercel).
export const dynamic = "force-dynamic";

export const { GET, POST } = toNextJsHandler(auth);