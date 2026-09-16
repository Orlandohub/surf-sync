import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { dash } from "@better-auth/infra";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { db } from "@/lib/db";
import * as authSchema from "@/lib/db/schema/auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
  plugins: [dash(), nextCookies()], // nextCookies must be last
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
