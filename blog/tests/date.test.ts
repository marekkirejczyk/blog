import { describe, it, expect } from "vitest";
import { shortDate, timeAgo } from "../src/lib/date.js";

describe("shortDate", () => {
  it("omits the year when it matches the reference year", () => {
    expect(shortDate(new Date("2025-03-15T12:00:00Z"), 2025)).toBe("Mar 15");
  });

  it("includes the year when it differs from the reference year", () => {
    expect(shortDate(new Date("2024-03-15T12:00:00Z"), 2025)).toBe("Mar 15, 2024");
  });

  it("uses the current year as default reference", () => {
    const thisYear = new Date().getFullYear();
    const thisYearDate = new Date(`${thisYear}-06-15T12:00:00Z`);
    expect(shortDate(thisYearDate)).toBe("Jun 15");
  });

  it("shows the year for dates in previous years by default", () => {
    expect(shortDate(new Date("2020-01-01T12:00:00Z"))).toBe("Jan 1, 2020");
  });
});

describe("timeAgo", () => {
  const NOW = new Date("2025-03-15T12:00:00Z");

  it("returns 'just now' for timestamps less than 60s old", () => {
    const thirtySecondsAgo = new Date(NOW.getTime() - 30 * 1000).toISOString();
    expect(timeAgo(thirtySecondsAgo, NOW)).toBe("just now");
  });

  it("returns 'just now' at the 59s boundary", () => {
    const justUnderAMinute = new Date(NOW.getTime() - 59 * 1000).toISOString();
    expect(timeAgo(justUnderAMinute, NOW)).toBe("just now");
  });

  it("returns minutes ago from 60s onward", () => {
    const oneMinute = new Date(NOW.getTime() - 60 * 1000).toISOString();
    expect(timeAgo(oneMinute, NOW)).toBe("1m ago");
  });

  it("returns minutes ago for mid-range values", () => {
    const fiveMinutes = new Date(NOW.getTime() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinutes, NOW)).toBe("5m ago");
  });

  it("returns hours ago from 60m onward", () => {
    const oneHour = new Date(NOW.getTime() - 60 * 60 * 1000).toISOString();
    expect(timeAgo(oneHour, NOW)).toBe("1h ago");
  });

  it("returns hours ago for mid-range values", () => {
    const threeHours = new Date(NOW.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeHours, NOW)).toBe("3h ago");
  });

  it("returns days ago from 24h onward", () => {
    const oneDay = new Date(NOW.getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(oneDay, NOW)).toBe("1d ago");
  });

  it("returns days ago for mid-range values", () => {
    const twoDays = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(twoDays, NOW)).toBe("2d ago");
  });

  it("returns days ago up to the 29d boundary", () => {
    const twentyNineDays = new Date(NOW.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(twentyNineDays, NOW)).toBe("29d ago");
  });

  it("falls back to shortDate for dates older than 30 days", () => {
    const thirtyDays = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    // 2025-03-15 minus 30d = 2025-02-13, same year as "now" → no year in output.
    expect(timeAgo(thirtyDays, NOW)).toBe("Feb 13");
  });

  it("falls back to shortDate with year for dates in previous years", () => {
    const lastYear = new Date("2024-06-01T12:00:00Z").toISOString();
    expect(timeAgo(lastYear, NOW)).toBe("Jun 1, 2024");
  });
});
