import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/matchers.ts"],
    typecheck: {
      tsconfig: "./tsconfig.test.json",
    },
  },
});
