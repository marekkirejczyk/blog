import { describe, it, expect } from "vitest";
import { parseDate, formatDate } from "../../src/utils/dates.js";

describe("parseDate", () => {
  it("parses SQLite datetime string as UTC", () => {
    const date = parseDate("2025-06-15 14:30:00");
    expect(date).toEqual(new Date("2025-06-15T14:30:00Z"));
  });

  it("returns a Date instance", () => {
    expect(parseDate("2025-01-01 00:00:00")).toBeInstanceOf(Date);
  });

  it("treats input as UTC (not local time)", () => {
    const date = parseDate("2025-06-15 00:00:00");
    expect(date.getUTCHours()).toBe(0);
  });
});

describe("formatDate", () => {
  it("formats Date to SQLite datetime string", () => {
    const date = new Date("2025-06-15T14:30:00Z");
    expect(formatDate(date)).toBe("2025-06-15 14:30:00");
  });

  it("strips milliseconds", () => {
    const date = new Date("2025-06-15T14:30:00.123Z");
    expect(formatDate(date)).toBe("2025-06-15 14:30:00");
  });

  it("uses space separator instead of T", () => {
    const result = formatDate(new Date("2025-01-01 00:00:00Z"));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});

describe("parseDate and formatDate roundtrip", () => {
  it("roundtrips correctly", () => {
    const original = "2025-06-15 14:30:00";
    expect(formatDate(parseDate(original))).toBe(original);
  });

  it("roundtrips Date through format then parse", () => {
    const original = new Date("2025-12-31T23:59:59Z");
    const roundtripped = parseDate(formatDate(original));
    expect(roundtripped.getTime()).toBe(original.getTime());
  });
});
