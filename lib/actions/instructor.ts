"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import {
  saveInstructorProfile,
  saveInstructorAvailability,
  setInstructorPaused,
  saveProfileSchema,
  saveAvailabilitySchema,
} from "@/lib/services/instructor";
import { requireInstructor } from "@/lib/services/authz";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function callerId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("UNAUTHORIZED");
  return session.user.id;
}

export async function saveProfileAction(input: unknown): Promise<ActionResult> {
  try {
    const userId = await callerId();
    await requireInstructor(userId); // type check at transport layer
    const parsed = saveProfileSchema.parse(input);
    await saveInstructorProfile(userId, parsed);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

export async function saveAvailabilityAction(input: unknown): Promise<ActionResult> {
  try {
    const userId = await callerId();
    await requireInstructor(userId);
    const parsed = saveAvailabilitySchema.parse(input);
    await saveInstructorAvailability(userId, parsed);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

export async function setPausedAction(paused: boolean): Promise<ActionResult> {
  try {
    const userId = await callerId();
    await requireInstructor(userId);
    await setInstructorPaused(userId, paused);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

function toMessage(e: unknown): string {
  if (e && typeof e === "object" && "body" in e) {
    const body = (e as { body?: { message?: string } }).body;
    if (body?.message) return body.message;
  }
  if (e instanceof Error && e.message === "UNAUTHORIZED") return "Sessão expirada. Inicie sessão novamente.";
  return "Ocorreu um erro. Tente novamente.";
}
