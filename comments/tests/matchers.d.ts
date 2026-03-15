import "vitest";

interface CustomMatchers<R = unknown> {
  toBeAround(expected: Date | number, withinMs?: number): R;
  toBeProperUUID(): R;
}

declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
