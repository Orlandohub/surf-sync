import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { dash } from "@better-auth/infra";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { db } from "@/lib/db";
import * as authSchema from "@/lib/db/schema/auth";
import { sendVerificationEmail } from "@/lib/email/send-verification";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset";
import {
  enforceVerificationEmailRateLimit,
  recordVerificationEmailSent,
} from "@/lib/services/verification";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    // SUR-17: 1-hour, single-use, server-stored reset tokens; a successful
    // reset revokes every session for the user.
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      // The hook runs inline in /request-password-reset, which returns a
      // generic "check your email" response for unknown addresses
      // (anti-enumeration). Only real accounts reach this hook, so any
      // error thrown here — e.g. our rate limiter — would leak account
      // existence. Swallow rate-limit errors; let transport errors
      // surface (they'd affect known and unknown addresses alike).
      try {
        await enforceVerificationEmailRateLimit(user.email);
      } catch (e) {
        if (e instanceof APIError && e.status === 429) return;
        throw e;
      }
      await sendPasswordResetEmail({ to: user.email, url });
      await recordVerificationEmailSent(user.email);
    },
  },
  plugins: [dash(), nextCookies()], // nextCookies must be last
  emailVerification: {
    expiresIn: 60 * 60 * 24, // 24 hours, single-use token
    sendOnSignUp: true, // auto-send after signup (no sign-in wall — onboarding step)
    sendVerificationEmail: async ({ user, url }) => {
      if (user.emailVerified) {
        throw new APIError("BAD_REQUEST", {
          message: "Email is already verified.",
        });
      }

      await enforceVerificationEmailRateLimit(user.email);
      await sendVerificationEmail({ to: user.email, url });
      await recordVerificationEmailSent(user.email);
    },
  },
  user: {
    additionalFields: {
      type: {
        type: ["school_staff", "instructor"],
        required: true,
        defaultValue: "school_staff",
      },
      phone: {
        type: "string",
        required: false,
      },
      lastLoginAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      update: {
        before: async (data) => {
          // Account type is immutable per the Auth PRD: set once at signup,
          // never mutated. Any update payload touching `type` is rejected —
          // this covers Better Auth endpoints (e.g. updateUser) that could
          // otherwise carry the field through.
          if ("type" in data && data.type !== undefined) {
            throw new APIError("BAD_REQUEST", {
              message: "Account type cannot be changed.",
            });
          }
          return { data };
        },
      },
    },
  },
});
