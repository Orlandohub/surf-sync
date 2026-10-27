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

/** Matches the server's default minimum (Better Auth minPasswordLength). */
export const MIN_PASSWORD_LENGTH = 8;

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

export type NewPasswordProblem = "passwordRequired" | "passwordTooShort";
export function newPasswordProblem(password: string): NewPasswordProblem | null {
  if (!password) return "passwordRequired";
  return password.length < MIN_PASSWORD_LENGTH ? "passwordTooShort" : null;
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
  | "passwordTooShort"
  | "rateLimited"
  | "generic";
export function signUpErrorKey(error: AuthClientError): SignUpErrorKey {
  if (isRateLimited(error)) return "rateLimited";
  // better-auth@1.6 answers a duplicate email with 422
  // USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL.
  if (error?.code?.startsWith("USER_ALREADY_EXISTS") || error?.status === 422) return "emailTaken";
  if (error?.code === "INVALID_EMAIL") return "emailInvalid";
  if (error?.code === "PASSWORD_TOO_SHORT") return "passwordTooShort";
  return "generic";
}

export type ResendErrorKey = "wait" | "daily" | "alreadyVerified" | "generic";
export function resendErrorKey(error: AuthClientError): ResendErrorKey {
  if (isRateLimited(error)) return /daily/i.test(error?.message ?? "") ? "daily" : "wait";
  if (error?.code === "EMAIL_ALREADY_VERIFIED" || /already verified/i.test(error?.message ?? "")) {
    return "alreadyVerified";
  }
  return "generic";
}

export type ResetPasswordErrorKey = "invalidToken" | "passwordTooShort" | "rateLimited" | "generic";
export function resetPasswordErrorKey(error: AuthClientError): ResetPasswordErrorKey {
  if (isRateLimited(error)) return "rateLimited";
  if (error?.code === "PASSWORD_TOO_SHORT") return "passwordTooShort";
  // INVALID_TOKEN (400): expired or already used — the token is
  // single-use and deleted on a successful reset.
  if (error?.code === "INVALID_TOKEN" || error?.status === 400) return "invalidToken";
  return "generic";
}

export type ChangePasswordErrorKey =
  | "wrongPassword"
  | "passwordTooShort"
  | "rateLimited"
  | "generic";
export function changePasswordErrorKey(error: AuthClientError): ChangePasswordErrorKey {
  if (isRateLimited(error)) return "rateLimited";
  if (error?.code === "PASSWORD_TOO_SHORT") return "passwordTooShort";
  if (error?.code === "INVALID_PASSWORD" || error?.code === "CREDENTIAL_ACCOUNT_NOT_FOUND") {
    return "wrongPassword";
  }
  return "generic";
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
