// TEMPORARY diagnostics route — reports env var PRESENCE and LENGTH only,
// never values. Remove after the env investigation.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const probe = (name: string) => {
    const v = process.env[name];
    return v === undefined ? "MISSING" : v === "" ? "EMPTY" : `set(len ${v.length})`;
  };
  return NextResponse.json({
    env: {
      DATABASE_URL: probe("DATABASE_URL"),
      BETTER_AUTH_SECRET: probe("BETTER_AUTH_SECRET"),
      BETTER_AUTH_URL: probe("BETTER_AUTH_URL"),
      BETTER_AUTH_API_KEY: probe("BETTER_AUTH_API_KEY"),
      RESEND_API_KEY: probe("RESEND_API_KEY"),
      EMAIL_FROM: probe("EMAIL_FROM"),
    },
    node: process.version,
  });
}
