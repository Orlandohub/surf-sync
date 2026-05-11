import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { dash } from "@better-auth/infra";
import { db } from "@/lib/db";
import * as authSchema from "@/lib/db/schema/auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
  plugins: [dash()],
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
});
