import { describe, expect, it } from "vitest";
import {
  dailyRemaining,
  withinMinuteWindow,
} from "@/lib/services/verification";

describe("verification-email rate limiter windows (SUR-16/17)", () => {
  const now = new Date("2026-09-16T12:00:00Z");

  it("blocks a send inside the 1-minute window", () => {
    expect(withinMinuteWindow(new Date("2026-09-16T11:59:59Z"), now)).toBe(true);
    expect(withinMinuteWindow(new Date("2026-09-16T11:59:01Z"), now)).toBe(true); // 59s
  });

  it("allows a send at or after the 1-minute boundary", () => {
    expect(withinMinuteWindow(new Date("2026-09-16T11:59:00.000Z"), new Date("2026-09-16T12:00:00.001Z"))).toBe(false);
    // exactly 60s elapsed = allowed (strict <)
    expect(withinMinuteWindow(new Date("2026-09-16T11:59:00Z"), now)).toBe(false);
    expect(withinMinuteWindow(new Date("2026-09-16T11:00:00Z"), now)).toBe(false);
  });

  it("caps daily sends at 5 and never returns negative", () => {
    expect(dailyRemaining(0)).toBe(5);
    expect(dailyRemaining(4)).toBe(1);
    expect(dailyRemaining(5)).toBe(0);
    expect(dailyRemaining(9)).toBe(0);
  });
});
