import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";

/**
 * The current Better-Auth session, read once per request.
 *
 * Wrapped in React `cache()`, so the root layout (which needs it for the
 * nav) and the page share one lookup. In pages and layouts always use
 * this, not `auth.api.getSession` (that would be a second DB query).
 * Server Actions keep calling `auth.api.getSession` (no render cache there).
 */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export type UserType = "instructor" | "school_staff";

/** What the app shell needs to render the nav — serializable, no tokens. */
export type ShellUser = {
  type: UserType;
  name: string;
  email: string;
};

export function toShellUser(
  session: Awaited<ReturnType<typeof getSession>>,
): ShellUser | null {
  if (!session) return null;
  const { type, name, email } = session.user;
  return {
    type: type === "instructor" ? "instructor" : "school_staff",
    name: name ?? "",
    email,
  };
}
