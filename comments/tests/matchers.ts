import { expect } from "vitest";
import type {} from "./matchers.d.ts";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

expect.extend({
  toBeAround(received: Date, expected: Date | number, withinMs = 1000) {
    const expectedMs = expected instanceof Date ? expected.getTime() : expected;
    const pass =
      received instanceof Date &&
      Math.abs(received.getTime() - expectedMs) < withinMs;
    return {
      pass,
      message: () =>
        `expected ${received.toISOString ? received.toISOString() : received} ${pass ? "not " : ""}to be within ${withinMs}ms of ${new Date(expectedMs).toISOString()}`,
    };
  },
  toBeProperUUID(received: string) {
    const pass = typeof received === "string" && UUID_REGEX.test(received);
    return {
      pass,
      message: () =>
        `expected ${JSON.stringify(received)} ${pass ? "not " : ""}to be a valid UUID`,
    };
  },
});
