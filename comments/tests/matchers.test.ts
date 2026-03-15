import { describe, it, expect } from "vitest";

describe("toBeAround", () => {
  it("passes for a Date close to expected timestamp", () => {
    const now = new Date();
    expect(now).toBeAround(Date.now());
  });

  it("accepts a Date as expected value", () => {
    const now = new Date();
    expect(now).toBeAround(new Date());
  });

  it("fails for a Date far from expected timestamp", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    expect(oneHourAgo).not.toBeAround(Date.now());
  });

  it("uses default tolerance of 1000ms", () => {
    const within = new Date(Date.now() - 500);
    const outside = new Date(Date.now() - 2000);
    expect(within).toBeAround(Date.now());
    expect(outside).not.toBeAround(Date.now());
  });

  it("respects custom tolerance", () => {
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    expect(fiveSecondsAgo).not.toBeAround(Date.now(), 1000);
    expect(fiveSecondsAgo).toBeAround(Date.now(), 10000);
  });

  it("works with future dates", () => {
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    expect(fiveMinutesFromNow).toBeAround(Date.now() + 5 * 60 * 1000);
  });
});

describe("toBeProperUUID", () => {
  it("passes for a valid UUID", () => {
    expect("550e8400-e29b-41d4-a716-446655440000").toBeProperUUID();
  });

  it("fails for a non-UUID string", () => {
    expect("not-a-uuid").not.toBeProperUUID();
  });

  it("fails for uppercase UUID", () => {
    expect("550E8400-E29B-41D4-A716-446655440000").not.toBeProperUUID();
  });

  it("fails for UUID without dashes", () => {
    expect("550e8400e29b41d4a716446655440000").not.toBeProperUUID();
  });
});
