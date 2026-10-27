import { describe, expect, it } from "vitest";
import { z } from "zod";
import { isEmail } from "@/components/school/email";
import {
  BOOKING_WEEKS,
  bookableDates,
  earliestStart,
  fromMinutes,
  lisbonMinutes,
  toMinutes,
  type Slot,
} from "@/components/school/booking-slots";
const TODAY = "2026-10-27"; // a Tuesday

describe("booking slots", () => {
  const ana: Slot[] = [
    { day: "tue", start: "09:00", end: "17:00" },
    { day: "sat", start: "08:00", end: "18:00" },
  ];

  it("converts times", () => {
    expect(toMinutes("07:30")).toBe(450);
    expect(fromMinutes(450)).toBe("07:30");
    expect(fromMinutes(toMinutes("18:00"))).toBe("18:00");
  });

  it("reads the Lisbon wall clock (summer and winter time)", () => {
    expect(lisbonMinutes("2026-10-27T20:15:00Z")).toBe(20 * 60 + 15); // WET, UTC+0
    expect(lisbonMinutes("2026-07-15T08:00:00Z")).toBe(9 * 60); // WEST, UTC+1
  });

  it("offers today only while a lesson still fits, from the next half hour", () => {
    const morning = "2026-10-27T10:10:00Z"; // Tuesday 10:10 in Lisbon
    expect(earliestStart(TODAY, ana[0], morning)).toBe(toMinutes("10:30"));
    expect(earliestStart("2026-10-31", ana[1], morning)).toBe(toMinutes("08:00"));
    expect(bookableDates(ana, morning, 1)).toEqual([TODAY, "2026-10-31"]);

    const evening = "2026-10-27T16:40:00Z"; // 16:40: no 30-minute lesson fits before 17:00
    expect(bookableDates(ana, evening, 1)).toEqual(["2026-10-31"]);
    expect(bookableDates(ana, evening, 2)).toEqual(["2026-10-31", "2026-11-03", "2026-11-07"]);
  });

  it("offers nothing without availability", () => {
    expect(bookableDates([], "2026-10-27T10:00:00Z")).toEqual([]);
  });

  it("offers BOOKING_WEEKS weeks ahead by default", () => {
    const dates = bookableDates(ana, "2026-10-27T10:10:00Z");
    expect(dates).toHaveLength(ana.length * BOOKING_WEEKS);
    expect(dates.at(-1)! > "2027-01-01").toBe(true);
  });
});

describe("client email check", () => {
  it("agrees with the server's z.string().email()", () => {
    const server = z.string().email();
    for (const value of [
      "ana@escola.pt",
      "x.y+z@a-b.co.uk",
      "a@b.c",
      "ana@escola.p",
      "ana@escola..pt",
      "ana@-escola.pt",
      "ana@escola",
      "ana escola@x.pt",
    ]) {
      expect(isEmail(value), value).toBe(server.safeParse(value).success);
    }
  });
});
