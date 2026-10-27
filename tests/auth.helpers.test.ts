import { describe, expect, it } from "vitest";
import {
  changePasswordErrorKey,
  describeDevice,
  emailProblem,
  homeFor,
  isAccountType,
  lisbonTimeOf,
  newPasswordProblem,
  resendErrorKey,
  resetPasswordErrorKey,
  signInErrorKey,
  signUpErrorKey,
} from "@/components/auth/auth-helpers";

// Shapes as Better Auth 1.6 returns them (checked against the local server).
const err = (status: number, code?: string, message?: string) => ({ status, code, message });

describe("auth validation", () => {
  it("flags a missing or malformed email", () => {
    expect(emailProblem("")).toBe("emailRequired");
    expect(emailProblem("   ")).toBe("emailRequired");
    expect(emailProblem("ana@")).toBe("emailInvalid");
    expect(emailProblem("ana.pt")).toBe("emailInvalid");
    expect(emailProblem(" ana@example.pt ")).toBeNull();
  });

  it("requires 8 to 128 characters for a new password", () => {
    expect(newPasswordProblem("")).toBe("passwordRequired");
    expect(newPasswordProblem("1234567")).toBe("passwordTooShort");
    expect(newPasswordProblem("12345678")).toBeNull();
    expect(newPasswordProblem("a".repeat(128))).toBeNull();
    expect(newPasswordProblem("a".repeat(129))).toBe("passwordTooLong");
  });

  it("knows the two account types and their homes", () => {
    expect(isAccountType("instructor")).toBe(true);
    expect(isAccountType("school_staff")).toBe(true);
    expect(isAccountType("admin")).toBe(false);
    expect(isAccountType(undefined)).toBe(false);
    expect(homeFor("instructor")).toBe("/instructor");
    expect(homeFor("school_staff")).toBe("/school");
    expect(homeFor(undefined)).toBe("/");
  });
});

describe("Better Auth error mapping", () => {
  it("sign-in stays generic about credentials", () => {
    expect(signInErrorKey(err(401, "INVALID_EMAIL_OR_PASSWORD"))).toBe("invalidCredentials");
    expect(signInErrorKey(err(400, "INVALID_EMAIL"))).toBe("invalidCredentials");
    expect(signInErrorKey(err(429))).toBe("rateLimited");
    expect(signInErrorKey(err(500))).toBe("generic");
  });

  it("sign-up maps duplicate email, bad input and rate limits", () => {
    expect(signUpErrorKey(err(422, "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"))).toBe("emailTaken");
    expect(signUpErrorKey(err(422))).toBe("emailTaken");
    expect(signUpErrorKey(err(400, "INVALID_EMAIL"))).toBe("emailInvalid");
    expect(signUpErrorKey(err(400, "PASSWORD_TOO_SHORT"))).toBe("passwordTooShort");
    expect(signUpErrorKey(err(400, "PASSWORD_TOO_LONG"))).toBe("passwordTooLong");
    expect(signUpErrorKey(err(429))).toBe("rateLimited");
    expect(signUpErrorKey(err(500))).toBe("generic");
  });

  it("resend tells the minute limit from the daily one", () => {
    expect(resendErrorKey(err(429, undefined, "Please wait a minute before requesting another email."))).toBe("wait");
    expect(resendErrorKey(err(429, undefined, "Daily verification email limit reached. Try again tomorrow."))).toBe("daily");
    expect(resendErrorKey(err(429, undefined, "Too many requests. Please try again later."))).toBe("wait");
    expect(resendErrorKey(err(400, "EMAIL_ALREADY_VERIFIED"))).toBe("alreadyVerified");
    expect(resendErrorKey(err(500))).toBe("generic");
  });

  it("reset treats INVALID_TOKEN or a bare 400 as a spent or expired link", () => {
    expect(resetPasswordErrorKey(err(400, "INVALID_TOKEN"))).toBe("invalidToken");
    expect(resetPasswordErrorKey(err(400))).toBe("invalidToken");
    expect(resetPasswordErrorKey(err(400, "PASSWORD_TOO_SHORT"))).toBe("passwordTooShort");
    expect(resetPasswordErrorKey(err(400, "PASSWORD_TOO_LONG"))).toBe("passwordTooLong");
    expect(resetPasswordErrorKey(err(400, "SOMETHING_ELSE"))).toBe("generic");
    expect(resetPasswordErrorKey(err(429))).toBe("rateLimited");
    expect(resetPasswordErrorKey(err(500))).toBe("generic");
  });

  it("change password points at the current password when it is wrong", () => {
    expect(changePasswordErrorKey(err(400, "INVALID_PASSWORD"))).toBe("wrongPassword");
    expect(changePasswordErrorKey(err(400, "PASSWORD_TOO_SHORT"))).toBe("passwordTooShort");
    expect(changePasswordErrorKey(err(400, "PASSWORD_TOO_LONG"))).toBe("passwordTooLong");
    expect(changePasswordErrorKey(err(429))).toBe("rateLimited");
    expect(changePasswordErrorKey(null)).toBe("generic");
  });
});

describe("lisbonTimeOf", () => {
  it("gives the Lisbon wall-clock time of an instant", () => {
    expect(lisbonTimeOf("2026-10-27T09:05:00Z")).toBe("09:05"); // WET, UTC+0
    expect(lisbonTimeOf("2026-07-15T23:30:00Z")).toBe("00:30"); // WEST, UTC+1
    expect(lisbonTimeOf(new Date("2026-03-29T01:00:00Z"))).toBe("02:00"); // DST starts
  });

  it("rejects an invalid instant", () => {
    expect(() => lisbonTimeOf("not a date")).toThrow(RangeError);
  });
});

describe("describeDevice", () => {
  it("reads common user agents", () => {
    expect(
      describeDevice(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
      ),
    ).toEqual({ os: "macOS", browser: "Safari", kind: "desktop" });
    expect(
      describeDevice(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      ),
    ).toEqual({ os: "iOS", browser: "Safari", kind: "phone" });
    expect(
      describeDevice(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36",
      ),
    ).toEqual({ os: "Android", browser: "Chrome", kind: "phone" });
    expect(
      describeDevice(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 Edg/124.0",
      ),
    ).toEqual({ os: "Windows", browser: "Edge", kind: "desktop" });
    expect(
      describeDevice("Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0 Mobile/15E148 Safari/604.1"),
    ).toEqual({ os: "iOS", browser: "Chrome", kind: "tablet" });
  });

  it("returns unknowns for missing or unrecognised agents", () => {
    expect(describeDevice(null)).toEqual({ os: null, browser: null, kind: "unknown" });
    expect(describeDevice("curl/8.5.0")).toEqual({ os: null, browser: null, kind: "unknown" });
  });
});
