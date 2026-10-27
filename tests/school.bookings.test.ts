import { describe, expect, it } from "vitest";
import { bookingStats, bookingTab, groupBookings, weekBounds } from "@/components/school/booking-groups";
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
import type { BookingView } from "@/lib/services/booking";

const TODAY = "2026-10-27"; // a Tuesday

function booking(over: Partial<BookingView>): BookingView {
  return {
    id: Math.random().toString(36).slice(2),
    instructorId: "i1",
    instructorName: "Ana Marques",
    schoolId: "s1",
    schoolName: "Onda Norte",
    requestedByName: "Marta Silva",
    bookingDate: TODAY,
    startTime: "09:00:00",
    endTime: "11:00:00",
    status: "requested",
    notes: null,
    declineReason: null,
    requestedAt: new Date("2026-10-20T10:00:00Z"),
    respondedAt: null,
    cancelledAt: null,
    ...over,
  };
}

describe("booking tabs", () => {
  it("puts waiting requests in pending and confirmed lessons in upcoming, from today on", () => {
    expect(bookingTab(booking({ status: "requested", bookingDate: "2026-10-31" }), TODAY)).toBe("pending");
    expect(bookingTab(booking({ status: "requested", bookingDate: TODAY }), TODAY)).toBe("pending");
    expect(bookingTab(booking({ status: "accepted", bookingDate: "2026-10-28" }), TODAY)).toBe("upcoming");
  });

  it("sends closed bookings and past days to history", () => {
    expect(bookingTab(booking({ status: "declined", bookingDate: "2026-10-29" }), TODAY)).toBe("history");
    expect(bookingTab(booking({ status: "cancelled", bookingDate: "2026-11-02" }), TODAY)).toBe("history");
    expect(bookingTab(booking({ status: "completed", bookingDate: "2026-10-22" }), TODAY)).toBe("history");
    expect(bookingTab(booking({ status: "accepted", bookingDate: "2026-10-26" }), TODAY)).toBe("history");
    expect(bookingTab(booking({ status: "requested", bookingDate: "2026-10-26" }), TODAY)).toBe("history");
  });

  it("sorts pending and upcoming soonest first, history latest first", () => {
    const groups = groupBookings(
      [
        booking({ id: "p2", status: "requested", bookingDate: "2026-11-02" }),
        booking({ id: "p1b", status: "requested", bookingDate: "2026-10-31", startTime: "13:00:00" }),
        booking({ id: "p1a", status: "requested", bookingDate: "2026-10-31", startTime: "10:00:00" }),
        booking({ id: "h1", status: "completed", bookingDate: "2026-10-22" }),
        booking({ id: "h2", status: "cancelled", bookingDate: "2026-10-25" }),
        booking({ id: "u1", status: "accepted", bookingDate: "2026-10-30" }),
        booking({ id: "u0", status: "accepted", bookingDate: "2026-10-28" }),
      ],
      TODAY,
    );
    expect(groups.pending.map((b) => b.id)).toEqual(["p1a", "p1b", "p2"]);
    expect(groups.upcoming.map((b) => b.id)).toEqual(["u0", "u1"]);
    expect(groups.history.map((b) => b.id)).toEqual(["h2", "h1"]);
  });
});

describe("Início stats", () => {
  it("bounds the calendar week Monday to Sunday", () => {
    expect(weekBounds(TODAY)).toEqual({ start: "2026-10-26", end: "2026-11-01" });
    expect(weekBounds("2026-11-01")).toEqual({ start: "2026-10-26", end: "2026-11-01" });
    expect(weekBounds("2026-10-26")).toEqual({ start: "2026-10-26", end: "2026-11-01" });
  });

  it("counts real lessons by period and requests still waiting", () => {
    const stats = bookingStats(
      [
        booking({ status: "completed", bookingDate: "2026-10-22" }), // last week, this month
        booking({ status: "cancelled", bookingDate: "2026-10-25" }), // not a lesson
        booking({ status: "accepted", bookingDate: "2026-10-28" }), // this week
        booking({ status: "declined", bookingDate: "2026-10-29" }),
        booking({ status: "accepted", bookingDate: "2026-10-30" }), // this week
        booking({ status: "requested", bookingDate: "2026-10-31" }), // pending
        booking({ status: "requested", bookingDate: "2026-11-02" }), // pending, next month
        booking({ status: "accepted", bookingDate: "2026-11-01" }), // this week, next month
      ],
      TODAY,
    );
    expect(stats).toEqual({ pending: 2, thisWeek: 3, thisMonth: 3 });
  });
});

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
