import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DAY_KEYS,
  addDays,
  dayKeyOf,
  daysFromToday,
  formatDate,
  formatDayDate,
  formatDayTime,
  formatDayTimeRange,
  formatNotificationTime,
  formatRelativeDay,
  formatSlot,
  formatTime,
  formatTimeRange,
  groupNotifications,
  lisbonDate,
  lisbonToday,
  notificationGroup,
  timeOptions,
  upcomingDates,
  weekdayLong,
  weekdayName,
  weekdayShort,
} from "@/lib/format";

// Tuesday 27 October 2026, 10:00 in Lisbon (WET, UTC+0 since DST ended on the 25th).
const NOW = new Date("2026-10-27T10:00:00Z");

describe("lisbonToday", () => {
  it("is the Lisbon calendar date", () => {
    expect(lisbonToday(NOW)).toBe("2026-10-27");
  });

  it("is already tomorrow in Lisbon while UTC is still before midnight (summer, UTC+1)", () => {
    expect(lisbonToday(new Date("2026-07-15T22:59:00Z"))).toBe("2026-07-15");
    expect(lisbonToday(new Date("2026-07-15T23:30:00Z"))).toBe("2026-07-16");
  });

  it("matches UTC in winter (UTC+0)", () => {
    expect(lisbonToday(new Date("2026-01-15T23:59:00Z"))).toBe("2026-01-15");
    expect(lisbonToday(new Date("2026-01-16T00:00:00Z"))).toBe("2026-01-16");
  });

  it("handles the DST start night (29 March 2026, 01:00 UTC)", () => {
    expect(lisbonToday(new Date("2026-03-28T23:59:00Z"))).toBe("2026-03-28");
    expect(lisbonToday(new Date("2026-03-29T00:59:00Z"))).toBe("2026-03-29");
    // After the switch Lisbon is UTC+1: 23:30 UTC is 00:30 on the 30th.
    expect(lisbonToday(new Date("2026-03-29T23:30:00Z"))).toBe("2026-03-30");
  });

  it("handles the DST end night (25 October 2026, 01:00 UTC)", () => {
    // Still WEST (UTC+1): 23:30 UTC on the 24th is 00:30 on the 25th.
    expect(lisbonToday(new Date("2026-10-24T23:30:00Z"))).toBe("2026-10-25");
    // Back on WET (UTC+0): 23:30 UTC on the 25th is still the 25th.
    expect(lisbonToday(new Date("2026-10-25T23:30:00Z"))).toBe("2026-10-25");
  });

  it("accepts ISO strings and epoch numbers", () => {
    expect(lisbonToday("2026-07-15T23:30:00Z")).toBe("2026-07-16");
    expect(lisbonToday(Date.UTC(2026, 6, 15, 23, 30))).toBe("2026-07-16");
  });
});

describe("daysFromToday / dayKeyOf", () => {
  it("counts calendar days from Lisbon today", () => {
    expect(daysFromToday("2026-10-27", NOW)).toBe(0);
    expect(daysFromToday("2026-10-28", NOW)).toBe(1);
    expect(daysFromToday("2026-10-26", NOW)).toBe(-1);
    expect(daysFromToday("2026-11-03", NOW)).toBe(7);
  });

  it("is a whole number across DST changes", () => {
    const sat = new Date("2026-03-28T12:00:00Z");
    expect(daysFromToday("2026-03-30", sat)).toBe(2);
    expect(daysFromToday("2026-04-04", sat)).toBe(7);
  });

  it("gives the weekday key of a calendar date", () => {
    expect(dayKeyOf("2026-10-27")).toBe("tue");
    expect(dayKeyOf("2026-10-31")).toBe("sat");
    expect(dayKeyOf("2026-11-01")).toBe("sun");
    expect(dayKeyOf("2026-11-02")).toBe("mon");
    expect(dayKeyOf("2000-02-29")).toBe("tue");
    expect(dayKeyOf("1969-12-31")).toBe("wed");
  });
});

describe("formatDate", () => {
  it("is day + lowercase month, no year in the current year", () => {
    expect(formatDate("2026-05-25", { now: NOW })).toBe("25 de maio");
    expect(formatDate("2026-10-01", { now: NOW })).toBe("1 de outubro");
  });

  it("adds the year only for other years", () => {
    expect(formatDate("2027-01-03", { now: NOW })).toBe("3 de janeiro de 2027");
    expect(formatDate("2025-12-31", { now: NOW })).toBe("31 de dezembro de 2025");
  });

  it("rejects timestamps — they need lisbonDate() first", () => {
    // 23:30 UTC on 15 July is already 16 July in Lisbon; reading the date
    // part would silently give the wrong day.
    expect(() => formatDate("2026-07-15T23:30:00.000Z", { now: NOW })).toThrow(RangeError);
    expect(() => formatRelativeDay("2026-07-15T23:30:00Z", { now: NOW })).toThrow(RangeError);
    expect(formatDate(lisbonDate("2026-07-15T23:30:00.000Z"), { now: NOW })).toBe("16 de julho");
  });

  it("rejects malformed and impossible dates", () => {
    expect(() => formatDate("25/05/2026", { now: NOW })).toThrow(RangeError);
    expect(() => formatDate("2026-13-01", { now: NOW })).toThrow(RangeError);
    expect(() => formatDate("2026-13-45", { now: NOW })).toThrow(RangeError);
    expect(() => formatDate("2026-04-31", { now: NOW })).toThrow(RangeError);
    expect(() => formatDate("2026-02-29", { now: NOW })).toThrow(RangeError);
    expect(() => formatDate("2026-00-10", { now: NOW })).toThrow(RangeError);
    expect(() => dayKeyOf("2026-10-00")).toThrow(RangeError);
  });

  it("accepts leap days", () => {
    expect(formatDate("2028-02-29", { now: NOW })).toBe("29 de fevereiro de 2028");
  });
});

describe("formatRelativeDay", () => {
  it.each([
    ["2026-10-27", "Hoje"],
    ["2026-10-28", "Amanhã"],
    ["2026-10-26", "Ontem"],
    ["2026-10-29", "Quinta"],
    ["2026-10-30", "Sexta"],
    ["2026-10-31", "Sábado"],
    ["2026-11-01", "Domingo"],
    ["2026-11-02", "Segunda"], // 6 days out: still a weekday name
    ["2026-11-03", "3 de novembro"], // 7 days out: the date
    ["2026-10-24", "24 de outubro"], // past: the date
    ["2027-01-05", "5 de janeiro de 2027"],
  ])("%s → %s", (date, expected) => {
    expect(formatRelativeDay(date, { now: NOW })).toBe(expected);
  });

  it("lowercases for mid-sentence use", () => {
    expect(formatRelativeDay("2026-10-28", { now: NOW, lowercase: true })).toBe("amanhã");
    expect(formatRelativeDay("2026-10-31", { now: NOW, lowercase: true })).toBe("sábado");
    expect(formatRelativeDay("2026-11-25", { now: NOW, lowercase: true })).toBe("25 de novembro");
  });

  it("uses Lisbon's date at the UTC-midnight edge (Vercel runs in UTC)", () => {
    // 23:30 UTC on 15 July is 00:30 on 16 July in Lisbon.
    const now = new Date("2026-07-15T23:30:00Z");
    expect(formatRelativeDay("2026-07-16", { now })).toBe("Hoje");
    expect(formatRelativeDay("2026-07-17", { now })).toBe("Amanhã");
    expect(formatRelativeDay("2026-07-15", { now })).toBe("Ontem");
  });

  it("is correct on the DST change nights", () => {
    const afterStart = new Date("2026-03-29T23:30:00Z"); // Mon 30 Mar, 00:30 WEST
    expect(formatRelativeDay("2026-03-30", { now: afterStart })).toBe("Hoje");
    expect(formatRelativeDay("2026-03-29", { now: afterStart })).toBe("Ontem");

    const beforeEnd = new Date("2026-10-24T23:30:00Z"); // Sun 25 Oct, 00:30 WEST
    expect(formatRelativeDay("2026-10-25", { now: beforeEnd })).toBe("Hoje");
    expect(formatRelativeDay("2026-10-26", { now: beforeEnd })).toBe("Amanhã");
    expect(formatRelativeDay("2026-10-31", { now: beforeEnd })).toBe("Sábado");
  });
});

describe("times", () => {
  it("formats running-text times without a leading zero", () => {
    expect(formatTime("09:00:00")).toBe("9:00");
    expect(formatTime("09:30")).toBe("9:30");
    expect(formatTime("14:05:00")).toBe("14:05");
    expect(formatTime("00:00:00")).toBe("0:00");
  });

  it("zero-pads slot times", () => {
    expect(formatSlot("9:00")).toBe("09:00");
    expect(formatSlot("09:00:00")).toBe("09:00");
    expect(formatSlot("17:30:00")).toBe("17:30");
  });

  it("joins ranges with an en dash and no spaces", () => {
    expect(formatTimeRange("09:00:00", "11:00:00")).toBe("9:00–11:00");
    expect(formatTimeRange("14:30", "17:00")).toBe("14:30–17:00");
  });

  it("accepts Postgres time values with fractional seconds", () => {
    expect(formatTime("09:00:00.000000")).toBe("9:00");
  });

  it("allows 24:00 as an end time, nothing later", () => {
    expect(formatTimeRange("20:00", "24:00:00")).toBe("20:00–24:00");
    expect(() => formatTime("24:30")).toThrow(RangeError);
  });

  it("rejects malformed and out-of-range times", () => {
    expect(() => formatTime("9h")).toThrow(RangeError);
    expect(() => formatTime("25:99")).toThrow(RangeError);
    expect(() => formatTime("09:60")).toThrow(RangeError);
    expect(() => formatTime("09:00:61")).toThrow(RangeError);
    expect(() => formatSlot("09:00 ")).toThrow(RangeError);
    expect(() => formatTime("2026-10-27T09:00:00Z")).toThrow(RangeError);
  });
});

describe("day + time lines", () => {
  it("uses one spaced middle dot", () => {
    expect(formatDayTime("2026-10-28", "09:00:00", { now: NOW })).toBe("Amanhã · 9:00");
    expect(formatDayTime("2026-10-31", "11:00:00", { now: NOW })).toBe("Sábado · 11:00");
    expect(formatDayTime("2026-12-05", "08:30:00", { now: NOW })).toBe("5 de dezembro · 8:30");
  });

  it("formats the booking line with a range", () => {
    expect(formatDayTimeRange("2026-10-28", "09:00:00", "11:00:00", { now: NOW })).toBe(
      "Amanhã · 9:00–11:00",
    );
  });
});

describe("lisbonDate / addDays", () => {
  it("gives an instant's Lisbon calendar date", () => {
    expect(lisbonDate(new Date("2026-07-15T22:59:00Z"))).toBe("2026-07-15");
    expect(lisbonDate(new Date("2026-07-15T23:30:00Z"))).toBe("2026-07-16");
    expect(lisbonDate("2026-01-15T23:30:00Z")).toBe("2026-01-15");
  });

  it("adds calendar days across months, years and DST", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(() => addDays("2026-03-01", 0.5)).toThrow(RangeError);
  });
});

describe("formatDayDate / upcomingDates (date pickers)", () => {
  it("pairs the relative day or weekday with the date", () => {
    expect(formatDayDate("2026-10-27", { now: NOW })).toBe("Hoje · 27 de outubro");
    expect(formatDayDate("2026-10-28", { now: NOW })).toBe("Amanhã · 28 de outubro");
    expect(formatDayDate("2026-10-30", { now: NOW })).toBe("Sexta · 30 de outubro");
    expect(formatDayDate("2026-11-10", { now: NOW })).toBe("Terça · 10 de novembro");
    expect(formatDayDate("2027-01-04", { now: NOW })).toBe("Segunda · 4 de janeiro de 2027");
  });

  it("lists the next dates from Lisbon today", () => {
    expect(upcomingDates(3, { now: NOW })).toEqual(["2026-10-27", "2026-10-28", "2026-10-29"]);
    // 23:30 UTC on 15 July is 16 July in Lisbon: the list starts there.
    expect(upcomingDates(1, { now: new Date("2026-07-15T23:30:00Z") })).toEqual(["2026-07-16"]);
  });

  it("can keep only some weekdays", () => {
    expect(upcomingDates(4, { now: NOW, days: ["sat", "sun"] })).toEqual([
      "2026-10-31",
      "2026-11-01",
      "2026-11-07",
      "2026-11-08",
    ]);
    expect(upcomingDates(5, { now: NOW, days: [] })).toEqual([]);
  });
});

describe("notificationGroup", () => {
  const now = new Date("2026-10-27T15:00:00Z");

  it.each([
    ["2026-10-27T00:10:00Z", "today"],
    ["2026-10-26T23:50:00Z", "yesterday"],
    ["2026-10-25T09:00:00Z", "week"],
    ["2026-10-21T09:00:00Z", "week"],
    ["2026-10-20T09:00:00Z", "earlier"],
    ["2026-10-27T15:00:30Z", "today"],
  ] as const)("%s → %s", (at, group) => {
    expect(notificationGroup(at, { now })).toBe(group);
  });

  it("uses the Lisbon day (summer)", () => {
    const summerNow = new Date("2026-07-16T08:00:00Z");
    expect(notificationGroup("2026-07-15T23:30:00Z", { now: summerNow })).toBe("today");
    expect(notificationGroup("2026-07-15T22:30:00Z", { now: summerNow })).toBe("yesterday");
  });

  it("groups a newest-first list in order", () => {
    const items = [
      { id: 1, at: "2026-10-27T14:00:00Z" },
      { id: 2, at: "2026-10-27T08:00:00Z" },
      { id: 3, at: "2026-10-26T20:00:00Z" },
      { id: 4, at: "2026-10-01T20:00:00Z" },
    ];
    expect(
      groupNotifications(items, (i) => i.at, { now }).map((g) => [g.group, g.items.map((i) => i.id)]),
    ).toEqual([
      ["today", [1, 2]],
      ["yesterday", [3]],
      ["earlier", [4]],
    ]);
  });
});

describe("formatNotificationTime", () => {
  const now = new Date("2026-10-27T15:00:00Z"); // 15:00 in Lisbon

  it("says Agora under a minute", () => {
    expect(formatNotificationTime(new Date("2026-10-27T14:59:30Z"), { now })).toBe("Agora");
  });

  it("counts minutes under an hour", () => {
    expect(formatNotificationTime(new Date("2026-10-27T14:55:00Z"), { now })).toBe("há 5 min");
    expect(formatNotificationTime(new Date("2026-10-27T14:01:00Z"), { now })).toBe("há 59 min");
  });

  it("shows Hoje / Ontem with the Lisbon time", () => {
    expect(formatNotificationTime(new Date("2026-10-27T09:05:00Z"), { now })).toBe("Hoje · 9:05");
    expect(formatNotificationTime(new Date("2026-10-26T09:10:00Z"), { now })).toBe("Ontem · 9:10");
    expect(formatNotificationTime("2026-10-26T21:45:00.000Z", { now })).toBe("Ontem · 21:45");
  });

  it("falls back to a short date, with the year only for other years", () => {
    expect(formatNotificationTime(new Date("2026-10-25T10:00:00Z"), { now })).toBe("25 out.");
    expect(formatNotificationTime(new Date("2026-05-02T10:00:00Z"), { now })).toBe("2 mai.");
    expect(formatNotificationTime(new Date("2025-10-25T10:00:00Z"), { now })).toBe("25 out. 2025");
  });

  it("buckets by the Lisbon day, not the UTC day (summer)", () => {
    const summerNow = new Date("2026-07-16T08:00:00Z"); // 09:00 on the 16th in Lisbon
    // 23:30 UTC on the 15th is 00:30 on the 16th in Lisbon → today.
    expect(formatNotificationTime(new Date("2026-07-15T23:30:00Z"), { now: summerNow })).toBe(
      "Hoje · 0:30",
    );
    expect(formatNotificationTime(new Date("2026-07-15T22:30:00Z"), { now: summerNow })).toBe(
      "Ontem · 23:30",
    );
  });

  it("reads both 1:30s on the DST end day", () => {
    const sunday = new Date("2026-10-25T12:00:00Z");
    expect(formatNotificationTime(new Date("2026-10-25T00:30:00Z"), { now: sunday })).toBe(
      "Hoje · 1:30",
    );
    expect(formatNotificationTime(new Date("2026-10-25T01:30:00Z"), { now: sunday })).toBe(
      "Hoje · 1:30",
    );
  });

  it("treats slight clock skew into the future as now", () => {
    expect(formatNotificationTime(new Date("2026-10-27T15:00:20Z"), { now })).toBe("Agora");
  });
});

describe("weekday names", () => {
  it("gives short labels Monday first", () => {
    expect(DAY_KEYS.map(weekdayShort)).toEqual(["seg", "ter", "qua", "qui", "sex", "sáb", "dom"]);
  });

  it("gives label and long forms", () => {
    expect(DAY_KEYS.map(weekdayName)).toEqual([
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
      "Domingo",
    ]);
    expect(weekdayLong("wed")).toBe("quarta-feira");
    expect(weekdayLong("sun")).toBe("domingo");
  });
});

describe("timeOptions", () => {
  it("defaults to 06:00–22:00 every 30 minutes, zero-padded", () => {
    const opts = timeOptions();
    expect(opts[0]).toBe("06:00");
    expect(opts[1]).toBe("06:30");
    expect(opts.at(-1)).toBe("22:00");
    expect(opts).toHaveLength(33);
  });

  it("honours a custom range and step, inclusive of max", () => {
    expect(timeOptions({ min: "08:00", max: "10:00", step: 60 })).toEqual(["08:00", "09:00", "10:00"]);
    expect(timeOptions({ min: "9:00", max: "10:00" })).toEqual(["09:00", "09:30", "10:00"]);
  });

  it("never goes past the end of the day", () => {
    expect(timeOptions({ min: "23:00", max: "23:59" })).toEqual(["23:00", "23:30"]);
  });

  it("rejects a non-positive step", () => {
    expect(() => timeOptions({ step: 0 })).toThrow(RangeError);
  });
});

describe("independent of the machine's time zone", () => {
  const original = process.env.TZ;
  beforeEach(() => {
    process.env.TZ = "Pacific/Kiritimati"; // UTC+14
  });
  afterEach(() => {
    process.env.TZ = original;
  });

  it("never shifts calendar dates", () => {
    expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(-14 * 60); // TZ really changed
    expect(formatDate("2026-10-28", { now: NOW })).toBe("28 de outubro");
    expect(dayKeyOf("2026-10-28")).toBe("wed");
    expect(formatRelativeDay("2026-10-28", { now: NOW })).toBe("Amanhã");
    expect(lisbonToday(NOW)).toBe("2026-10-27");
    expect(formatNotificationTime(new Date("2026-10-27T09:05:00Z"), { now: NOW })).toBe("há 55 min");
  });

  it("also holds far west of UTC", () => {
    process.env.TZ = "Pacific/Honolulu"; // UTC−10
    expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(10 * 60);
    expect(formatRelativeDay("2026-10-27", { now: NOW })).toBe("Hoje");
    expect(formatDate("2026-01-01", { now: NOW })).toBe("1 de janeiro");
    expect(formatNotificationTime(new Date("2026-10-26T23:30:00Z"), { now: NOW })).toBe(
      "Ontem · 23:30",
    );
  });
});
