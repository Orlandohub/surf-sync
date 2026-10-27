import { describe, expect, it } from "vitest";
import {
  bookingList,
  displayStatus,
  groupBookings,
  isLesson,
  monthLessons,
  type BookingStatus,
} from "@/lib/booking-view";

const TODAY = "2026-10-27"; // a Tuesday

let n = 0;
function booking(over: Partial<{ status: BookingStatus; bookingDate: string; startTime: string; endTime: string }>) {
  n += 1;
  return {
    id: `b${n}`,
    status: "requested" as BookingStatus,
    bookingDate: TODAY,
    startTime: "09:00:00",
    endTime: "11:00:00",
    ...over,
  };
}

describe("bookingList", () => {
  it("puts open requests and confirmed lessons from today on in their own lists", () => {
    expect(bookingList(booking({ status: "requested", bookingDate: TODAY }), TODAY)).toBe("requests");
    expect(bookingList(booking({ status: "requested", bookingDate: "2026-10-31" }), TODAY)).toBe("requests");
    expect(bookingList(booking({ status: "accepted", bookingDate: "2026-10-28" }), TODAY)).toBe("upcoming");
  });

  it("sends closed bookings and past days to history", () => {
    expect(bookingList(booking({ status: "requested", bookingDate: "2026-10-24" }), TODAY)).toBe("history");
    expect(bookingList(booking({ status: "accepted", bookingDate: "2026-10-26" }), TODAY)).toBe("history");
    for (const status of ["declined", "cancelled", "completed"] as const) {
      expect(bookingList(booking({ status, bookingDate: "2026-11-02" }), TODAY)).toBe("history");
    }
  });
});

describe("groupBookings", () => {
  it("sorts requests and upcoming soonest first, history latest first", () => {
    const later = booking({ status: "accepted", bookingDate: "2026-10-30" });
    const sooner = booking({ status: "accepted", bookingDate: "2026-10-28", startTime: "14:00" });
    const soonest = booking({ status: "accepted", bookingDate: "2026-10-28", startTime: "09:00" });
    const old = booking({ status: "cancelled", bookingDate: "2026-10-01" });
    const recent = booking({ status: "declined", bookingDate: "2026-10-20" });
    const groups = groupBookings([later, old, sooner, recent, soonest], TODAY);
    expect(groups.upcoming.map((b) => b.id)).toEqual([soonest.id, sooner.id, later.id]);
    expect(groups.history.map((b) => b.id)).toEqual([recent.id, old.id]);
    expect(groups.requests).toEqual([]);
  });
});

describe("displayStatus", () => {
  it("shows a request nobody answered whose day has passed as expired", () => {
    expect(displayStatus(booking({ status: "requested", bookingDate: "2026-10-24" }), TODAY)).toBe("expired");
    expect(displayStatus(booking({ status: "requested", bookingDate: TODAY }), TODAY)).toBe("requested");
    expect(displayStatus(booking({ status: "accepted", bookingDate: "2026-10-24" }), TODAY)).toBe("accepted");
  });
});

describe("lessons", () => {
  it("counts accepted and completed lessons as lessons", () => {
    expect(isLesson({ status: "accepted" })).toBe(true);
    expect(isLesson({ status: "completed" })).toBe(true);
    expect(isLesson({ status: "requested" })).toBe(false);
    expect(isLesson({ status: "cancelled" })).toBe(false);
  });

  it("totals this month's lessons and hours", () => {
    const stats = monthLessons(
      [
        booking({ status: "accepted", bookingDate: "2026-10-30", startTime: "09:00", endTime: "11:30" }),
        booking({ status: "completed", bookingDate: "2026-10-02", startTime: "14:00", endTime: "15:00" }),
        booking({ status: "cancelled", bookingDate: "2026-10-10" }),
        booking({ status: "accepted", bookingDate: "2026-11-02" }),
      ],
      TODAY,
    );
    expect(stats).toEqual({ lessons: 2, hours: 3.5 });
  });
});
