import { ZodError } from "zod";
import { getTranslations } from "next-intl/server";

/**
 * Shared failure handling for the Server Actions in this folder. Not a
 * "use server" module on purpose: nothing here should be callable from
 * the client.
 */

/** What an action's session lookup throws when nobody is signed in. */
export const UNAUTHORIZED = "UNAUTHORIZED";

/**
 * The message an action returns when it fails. A service's APIError
 * already carries a PT-PT message written for the person (services keep
 * plain strings, no Next APIs), so it passes through. The rest — no
 * session, input that fails the Zod schema, anything unexpected — comes
 * from the "Errors" namespace. Unexpected errors are logged, not
 * swallowed (no Sentry yet: SUR-28).
 */
export async function actionErrorMessage(e: unknown): Promise<string> {
  const fromService = serviceMessage(e);
  if (fromService) return fromService;

  const t = await getTranslations("Errors");
  if (e instanceof Error && e.message === UNAUTHORIZED) return t("sessionExpired");
  if (e instanceof ZodError) return t("invalid");
  console.error(e);
  return t("generic");
}

function serviceMessage(e: unknown): string | null {
  if (e && typeof e === "object" && "body" in e) {
    const message = (e as { body?: { message?: unknown } }).body?.message;
    if (typeof message === "string" && message) return message;
  }
  return null;
}
