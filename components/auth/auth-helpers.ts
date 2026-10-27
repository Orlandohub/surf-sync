import { TIME_ZONE } from "@/lib/format";

/**
 * Pure helpers for the auth screens: client-side validation and mapping
 * Better Auth client errors onto PT-PT message keys. No React, no Next —
 * unit-tested in tests/auth.helpers.test.ts.
 *
 * Better Auth (1.6) client calls resolve to `{ data, error }`; `error`
 * carries the HTTP `status`, an upper-snake `code` (BASE_ERROR_CODES) and
 * an English `message`. Our own email limiter (lib/services/verification.ts)
 * throws 429 with "Please wait a minute…" (1 per minute) or "Daily …
 * limit reached" (5 per 24 h), shared by verification and reset emails.
 */

export type AuthClientError =
  | { status?: number; code?: string; message?: string; statusText?: string }
  | null
  | undefined;

/** Match the server's defaults (Better Auth min/maxPasswordLength). */
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

/** The account types a person can choose at sign-up (immutable after). */
export const ACCOUNT_TYPES = ["school_staff", "instructor"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export function isAccountType(value: unknown): value is AccountType {
  return typeof value === "string" && (ACCOUNT_TYPES as readonly string[]).includes(value);
}

/** Where a signed-in person lands, by account type. */
export function homeFor(type: unknown): string {
  return type === "instructor" ? "/instructor" : type === "school_staff" ? "/school" : "/";
}

// Deliberately loose: the server validates for real; this only catches
// obvious slips ("ana@", "ana.pt") before a round trip.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailProblem = "emailRequired" | "emailInvalid";
export function emailProblem(email: string): EmailProblem | null {
  const value = email.trim();
  if (!value) return "emailRequired";
  return EMAIL_SHAPE.test(value) ? null : "emailInvalid";
}

export type NewPasswordProblem = "passwordRequired" | "passwordTooShort" | "passwordTooLong";
export function newPasswordProblem(password: string): NewPasswordProblem | null {
  if (!password) return "passwordRequired";
  if (password.length < MIN_PASSWORD_LENGTH) return "passwordTooShort";
  return password.length > MAX_PASSWORD_LENGTH ? "passwordTooLong" : null;
}

/** Better Auth's length codes (sign-up, reset, change password). */
type PasswordLengthKey = "passwordTooShort" | "passwordTooLong";
function passwordLengthKey(error: AuthClientError): PasswordLengthKey | null {
  if (error?.code === "PASSWORD_TOO_SHORT") return "passwordTooShort";
  if (error?.code === "PASSWORD_TOO_LONG") return "passwordTooLong";
  return null;
}

const isRateLimited = (error: AuthClientError) => error?.status === 429;

export type SignInErrorKey = "invalidCredentials" | "rateLimited" | "generic";
export function signInErrorKey(error: AuthClientError): SignInErrorKey {
  if (isRateLimited(error)) return "rateLimited";
  // Never say which part was wrong (anti-enumeration).
  if (
    error?.code === "INVALID_EMAIL_OR_PASSWORD" ||
    error?.code === "INVALID_EMAIL" ||
    error?.code === "INVALID_PASSWORD" ||
    error?.status === 401
  ) {
    return "invalidCredentials";
  }
  return "generic";
}

export type SignUpErrorKey =
  | "emailTaken"
  | "emailInvalid"
  | PasswordLengthKey
  | "rateLimited"
  | "generic";
export function signUpErrorKey(error: AuthClientError): SignUpErrorKey {
  if (isRateLimited(error)) return "rateLimited";
  // better-auth@1.6 answers a duplicate email with 422
  // USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL.
  if (error?.code?.startsWith("USER_ALREADY_EXISTS") || error?.status === 422) return "emailTaken";
  if (error?.code === "INVALID_EMAIL") return "emailInvalid";
  return passwordLengthKey(error) ?? "generic";
}

export type ResendErrorKey = "wait" | "daily" | "alreadyVerified" | "generic";
export function resendErrorKey(error: AuthClientError): ResendErrorKey {
  if (isRateLimited(error)) return /daily/i.test(error?.message ?? "") ? "daily" : "wait";
  if (error?.code === "EMAIL_ALREADY_VERIFIED" || /already verified/i.test(error?.message ?? "")) {
    return "alreadyVerified";
  }
  return "generic";
}

export type ResetPasswordErrorKey = "invalidToken" | PasswordLengthKey | "rateLimited" | "generic";
export function resetPasswordErrorKey(error: AuthClientError): ResetPasswordErrorKey {
  if (isRateLimited(error)) return "rateLimited";
  const length = passwordLengthKey(error);
  if (length) return length;
  // INVALID_TOKEN (400): expired or already used — the token is
  // single-use and deleted on a successful reset. A 400 without a code is
  // treated the same; a 400 with another code (e.g. a length rule) is not.
  if (error?.code === "INVALID_TOKEN" || (error?.status === 400 && !error.code)) return "invalidToken";
  return "generic";
}

export type ChangePasswordErrorKey =
  | "wrongPassword"
  | PasswordLengthKey
  | "rateLimited"
  | "generic";
export function changePasswordErrorKey(error: AuthClientError): ChangePasswordErrorKey {
  if (isRateLimited(error)) return "rateLimited";
  const length = passwordLengthKey(error);
  if (length) return length;
  if (error?.code === "INVALID_PASSWORD" || error?.code === "CREDENTIAL_ACCOUNT_NOT_FOUND") {
    return "wrongPassword";
  }
  return "generic";
}

const lisbonClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * The Lisbon wall-clock time of an instant as "HH:MM", ready for
 * lib/format's formatTime ("09:05" → "9:05"). Pairs with lisbonDate().
 */
export function lisbonTimeOf(at: Date | string | number): string {
  const parts = lisbonClock.formatToParts(new Date(at));
  const get = (type: "hour" | "minute") => Number(parts.find((p) => p.type === type)?.value ?? NaN);
  const hour = get("hour") % 24; // some engines report midnight as 24
  const minute = get("minute");
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) throw new RangeError("Invalid instant");
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export type DeviceKind = "phone" | "tablet" | "desktop" | "unknown";
export type Device = { os: string | null; browser: string | null; kind: DeviceKind };

/**
 * Coarse device description from a user-agent string (display only).
 * OS and browser names are proper nouns; the caller translates the
 * unknown cases.
 */
export function describeDevice(ua: string | null | undefined): Device {
  if (!ua) return { os: null, browser: null, kind: "unknown" };
  const os = /Windows/i.test(ua)
    ? "Windows"
    : /iPhone|iPad|iPod/i.test(ua)
      ? "iOS"
      : /Android/i.test(ua)
        ? "Android"
        : /Macintosh|Mac OS/i.test(ua)
          ? "macOS"
          : /CrOS/i.test(ua)
            ? "ChromeOS"
            : /Linux/i.test(ua)
              ? "Linux"
              : null;
  const browser = /Edg(e|A|iOS)?\//i.test(ua)
    ? "Edge"
    : /OPR\/|Opera/i.test(ua)
      ? "Opera"
      : /Firefox\/|FxiOS\//i.test(ua)
        ? "Firefox"
        : /Chrome\/|CriOS\//i.test(ua)
          ? "Chrome"
          : /Safari\//i.test(ua)
            ? "Safari"
            : null;
  const kind: DeviceKind = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))
    ? "tablet"
    : /iPhone|iPod|Mobile/i.test(ua)
      ? "phone"
      : os
        ? "desktop"
        : "unknown";
  return { os, browser, kind };
}
