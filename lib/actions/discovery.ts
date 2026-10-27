"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { toggleBookmark } from "@/lib/services/discovery";
import { actionErrorMessage, UNAUTHORIZED } from "@/lib/actions/errors";

export type BookmarkResult =
  | { ok: true; bookmarked: boolean }
  | { ok: false; error: string };

export async function toggleBookmarkAction(
  instructorId: string,
): Promise<BookmarkResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error(UNAUTHORIZED);
    const bookmarked = await toggleBookmark(session.user.id, instructorId);
    return { ok: true, bookmarked };
  } catch (e) {
    return { ok: false, error: await actionErrorMessage(e) };
  }
}
