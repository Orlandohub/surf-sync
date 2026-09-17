"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import {
  requestBooking,
  respondToBooking,
  cancelBooking,
  requestBookingSchema,
} from "@/lib/services/booking";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/services/notifications";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function callerId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("UNAUTHORIZED");
  return session.user.id;
}

export async function requestBookingAction(input: unknown): Promise<ActionResult> {
  try {
    const userId = await callerId();
    const parsed = requestBookingSchema.parse(input);
    await requestBooking(userId, parsed);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

export async function respondBookingAction(
  bookingId: string,
  accept: boolean,
  declineReason?: string,
): Promise<ActionResult> {
  try {
    const userId = await callerId();
    await respondToBooking(userId, bookingId, accept, declineReason);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

export async function cancelBookingAction(bookingId: string): Promise<ActionResult> {
  try {
    const userId = await callerId();
    await cancelBooking(userId, bookingId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

export async function markNotificationReadAction(notificationId: string): Promise<ActionResult> {
  try {
    const userId = await callerId();
    await markNotificationRead(userId, notificationId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Ocorreu um erro." };
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  try {
    const userId = await callerId();
    await markAllNotificationsRead(userId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Ocorreu um erro." };
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
