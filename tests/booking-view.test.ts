import { describe, expect, it } from "vitest";
import {
  bookingList,
  displayStatus,
  groupBookings,
  isLesson,
  monthLessons,
  weekBounds,
  weekLessons,
  type BookingDisplayStatus,
  type BookingStatus,
} from "@/lib/booking-view";
import { bookingStatusIcon, bookingStatusTone } from "@/components/brand/status-badge";
import type { BookingView } from "@/lib/services/booking";

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

/** A full row as the school's screens get it (listSchoolBookings). */
function schoolBooking(over: Partial<BookingView>): BookingView {
  n += 1;
  return {
    id: `s${n}`,
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

describe("bookingList", () => {
  it("puts open requests and confirmed lessons from today on in their own lists", () => {
    expect(bookingList(booking({ status: "requested", bookingDate: TODAY }), TODAY)).toBe("requests");
    expect(bookingList(booking({ status: "requested", bookingDate: "2026-10-31" }), TODAY)).toBe("requests");
    expect(bookingList(booking({ status: "accepted", bookingDate: "2026-10-28" }), TODAY)).toBe("upcoming");
    expect(bookingList(booking({ status: "accepted", bookingDate: TODAY }), TODAY)).toBe("upcoming");
  });

  it("sends closed bookings and past days to history", () => {
    expect(bookingList(booking({ status: "requested", bookingDate: "2026-10-24" }), TODAY)).toBe("history");
    expect(bookingList(booking({ status: "requested", bookingDate: "2026-10-26" }), TODAY)).toBe("history");
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

  it("splits the school's bookings the same way (its 'Pendentes' tab is the requests list)", () => {
    const groups = groupBookings(
      [
        schoolBooking({ id: "p2", status: "requested", bookingDate: "2026-11-02" }),
        schoolBooking({ id: "p1b", status: "requested", bookingDate: "2026-10-31", startTime: "13:00:00" }),
        schoolBooking({ id: "p1a", status: "requested", bookingDate: "2026-10-31", startTime: "10:00:00" }),
        schoolBooking({ id: "x1", status: "requested", bookingDate: "2026-10-26" }), // unanswered, day passed
        schoolBooking({ id: "h1", status: "completed", bookingDate: "2026-10-22" }),
        schoolBooking({ id: "h2", status: "cancelled", bookingDate: "2026-10-25" }),
        schoolBooking({ id: "u1", status: "accepted", bookingDate: "2026-10-30" }),
        schoolBooking({ id: "u0", status: "accepted", bookingDate: "2026-10-28" }),
      ],
      TODAY,
    );
    expect(groups.requests.map((b) => b.id)).toEqual(["p1a", "p1b", "p2"]);
    expect(groups.upcoming.map((b) => b.id)).toEqual(["u0", "u1"]);
    expect(groups.history.map((b) => b.id)).toEqual(["x1", "h2", "h1"]);
    // The rows keep their full shape (instructor name, notes…).
    expect(groups.upcoming[0].instructorName).toBe("Ana Marques");
  });
});

describe("displayStatus", () => {
  it("shows a request nobody answered whose day has passed as expired", () => {
    expect(displayStatus(booking({ status: "requested", bookingDate: "2026-10-24" }), TODAY)).toBe("expired");
    expect(displayStatus(booking({ status: "requested", bookingDate: "2026-10-26" }), TODAY)).toBe("expired");
    expect(displayStatus(booking({ status: "requested", bookingDate: TODAY }), TODAY)).toBe("requested");
    expect(displayStatus(booking({ status: "accepted", bookingDate: "2026-10-24" }), TODAY)).toBe("accepted");
    expect(displayStatus(booking({ status: "declined", bookingDate: "2026-10-26" }), TODAY)).toBe("declined");
  });

  it("reads the same for both sides: an expired request is a neutral 'Sem resposta', never pending", () => {
    const expired = displayStatus(schoolBooking({ status: "requested", bookingDate: "2026-10-26" }), TODAY);
    expect(expired).toBe("expired");
    expect(bookingStatusTone(expired)).toBe("neutral");
    expect(bookingStatusTone(expired)).not.toBe(bookingStatusTone("requested"));
    expect(bookingStatusIcon(expired)).not.toBe(bookingStatusIcon("requested"));
  });

  it("has a tone and an icon for every display status", () => {
    const all: BookingDisplayStatus[] = ["requested", "accepted", "declined", "cancelled", "completed", "expired"];
    for (const status of all) {
      expect(bookingStatusTone(status), status).toBeTruthy();
      expect(bookingStatusIcon(status), status).toBeTruthy();
    }
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

  it("bounds the calendar week Monday to Sunday", () => {
    expect(weekBounds(TODAY)).toEqual({ start: "2026-10-26", end: "2026-11-01" });
    expect(weekBounds("2026-11-01")).toEqual({ start: "2026-10-26", end: "2026-11-01" });
    expect(weekBounds("2026-10-26")).toEqual({ start: "2026-10-26", end: "2026-11-01" });
  });

  it("counts the school's Início tiles: requests waiting, lessons this week and this month", () => {
    const bookings = [
      schoolBooking({ status: "completed", bookingDate: "2026-10-22" }), // last week, this month
      schoolBooking({ status: "cancelled", bookingDate: "2026-10-25" }), // not a lesson
      schoolBooking({ status: "accepted", bookingDate: "2026-10-28" }), // this week
      schoolBooking({ status: "declined", bookingDate: "2026-10-29" }),
      schoolBooking({ status: "accepted", bookingDate: "2026-10-30" }), // this week
      schoolBooking({ status: "requested", bookingDate: "2026-10-31" }), // waiting
      schoolBooking({ status: "requested", bookingDate: "2026-11-02" }), // waiting, next month
      schoolBooking({ status: "requested", bookingDate: "2026-10-26" }), // expired: not waiting
      schoolBooking({ status: "accepted", bookingDate: "2026-11-01" }), // this week, next month
    ];
    expect(groupBookings(bookings, TODAY).requests).toHaveLength(2);
    expect(weekLessons(bookings, TODAY)).toBe(3);
    expect(monthLessons(bookings, TODAY).lessons).toBe(3);
  });
});
