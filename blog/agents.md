# Blog Conventions

Conventions for the Astro blog at zkmarek.com. For feature specs see `docs/comments.md` and `docs/subscribe.md`.

## Stack

- **Framework**: Astro 5 (static site)
- **TypeScript**: strict mode (extends `astro/tsconfigs/strict`)
- **Testing**: Vitest

## JavaScript in Astro Components

- Keep JS logic out of `.astro` files — extract it to `.ts` files in `src/lib/` with tests
- `.astro` `<script>` blocks should contain only minimal binding code: reading data attributes, attaching event listeners, calling imported functions
- All business logic, API calls, rendering, and formatting belong in `src/lib/` modules
- Client-side modules split by feature: `lib/comments/api.ts`, `lib/comments/ui.ts`, `lib/subscribe/api.ts`
- API modules wrap `fetch()` with `credentials: "include"`
- UI modules are pure functions (no DOM, no fetch) — testable rendering, escaping, formatting

## Astro Component Patterns

- Data attributes (`data-slug`, `data-api-base`) to pass SSR values to client-side JS
- `import.meta.env.PUBLIC_COMMENTS_API` for API base, passed via data attributes

## Testing

- Split JS into small, focused functions in `src/lib/` so they can be tested
- **Unit tests** for pure logic functions (rendering, formatting, escaping) — no network, no DOM
- **Integration tests** for data access functions (fetch wrappers in `api.ts`) — test against the real comments server by instantiating `TestApp` (from `comments/src/app.ts`) with in-memory SQLite, not mocked fetch
- See `tests/comments/ui.test.ts` (unit) and `tests/comments/api.test.ts` (integration) for examples
- Prefer full-output matches over asserting individual fields — one deep-equality assertion documents the whole shape and catches unexpected changes. Use `toEqual` for deep equality; reserve `toBe` for primitives and reference identity. For non-deterministic fields (IDs, timestamps, tokens), use asymmetric matchers inside `toEqual` instead of splitting into per-field `expect`s.

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
- Never use `toThrow()` / `rejects.toThrow()` (or `toThrowError`) bare — always pin the thrown message or matcher. A bare assertion only proves *something* threw, so the error copy the user sees can silently rot.

  BAD:
  ```ts
  await expect(subscribe(API_BASE, "not-an-email")).rejects.toThrow();
  ```

  GOOD:
  ```ts
  await expect(subscribe(API_BASE, "not-an-email"))
    .rejects.toThrow("Invalid email address");
  ```

## Dialogs

- Each dialog must be a separate `.astro` file with minimal JS, one concern per file
- Use HTML `<dialog>` element with `showModal()` / `close()`
- Close on backdrop click (`e.target === dialog`) and close button
