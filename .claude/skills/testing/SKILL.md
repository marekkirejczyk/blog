---
name: testing
description: Testing conventions for the zkmarek.com monorepo (blog + comments). Use when writing or reviewing Vitest tests in this repo — covers unit/integration split, full-output matching with toEqual, banning bare toThrow(), and keeping pure logic decoupled from I/O.
---

# Testing Conventions

Shared rules for tests across the zkmarek.com monorepo. Project-specific
wiring (fixtures, custom matchers, file layout) lives in each workspace's
`agents.md`.

## Framework

- **Vitest** in both workspaces (`blog/`, `comments/`).

## Unit vs integration tests

- **Unit tests** for pure logic functions (rendering, formatting, escaping) —
  no network, no DOM, plain inputs.
- **Integration tests** for data access and wiring — exercise the real
  composition (e.g. instantiate the project's `TestApp` against in-memory
  SQLite). Do not mock `fetch` when an integration target is reachable.

## Split code so it can be tested

- Keep business logic in importable modules (e.g. `src/lib/`) rather than in
  `.astro` `<script>` blocks or route handlers, so tests can import the
  functions directly.
- Decouple pure logic from I/O. If a function reads a file (or makes a
  network/DB call) *and* transforms the result, split it: the core takes the
  already-loaded value, and a thin wrapper does the I/O and delegates. Tests
  target the core with in-memory fixtures (no `mkdtempSync`, no HTTP mocks)
  and cover the wrapper with one or two I/O-path cases. Example:
  `extractExcerpt(content, slug, wordLimit?)` parses markdown;
  `extractExcerptFromPost(contentDir, slug, wordLimit?)` reads the file and
  calls it.

## Prefer full-output matches over per-field assertions

One deep-equality assertion documents the whole shape and catches unexpected
changes. Use `toEqual` for deep equality; reserve `toBe` for primitives and
reference identity. For non-deterministic fields (IDs, timestamps, tokens),
use asymmetric matchers inside `toEqual` instead of splitting into per-field
`expect`s.

BAD:
```ts
it("creates a pending subscriber and returns a confirmation token", async () => {
  const result = await subscribe(API_BASE, "alice@example.com");
  expect(result.message).toBe("Check your email to confirm your subscription.");
  expect(typeof result.confirmationToken).toBe("string");
  expect(typeof result.subscriber.id).toBe("number");
  expect(result.subscriber.email).toMatch(/@/);
});
```

GOOD:
```ts
it("creates a pending subscriber and returns a confirmation token", async () => {
  const result = await subscribe(API_BASE, "alice@example.com");
  expect(result).toEqual({
    message: "Check your email to confirm your subscription.",
    confirmationToken: expect.any(String),
    subscriber: expect.objectContaining({
      id: expect.any(Number),
      email: expect.stringMatching(/@/),
    }),
  });
});
```

## Never use bare `toThrow()`

Never use `toThrow()` / `rejects.toThrow()` (or `toThrowError`) bare — always
pin the thrown message or matcher. A bare assertion only proves *something*
threw, so the error copy the user sees can silently rot.

BAD:
```ts
await expect(subscribe(API_BASE, "not-an-email")).rejects.toThrow();
```

GOOD:
```ts
await expect(subscribe(API_BASE, "not-an-email"))
  .rejects.toThrow("Invalid email address");
```
