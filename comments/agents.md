# Project Conventions

General conventions for the zkmarek.com monorepo. For comments system specification see `docs/comments.md`.

## Stack

- **Runtime**: Node.js + TypeScript (ESM, strict mode)
- **Blog**: Astro static site
- **API**: Hono framework
- **Database**: SQLite via better-sqlite3 (WAL mode, foreign keys)
- **Testing**: Vitest

## Code Conventions

- **ESM**: `"type": "module"` — always use `.js` extensions in relative imports
- **TypeScript**: `"strict": true`, target `ESNext`, `moduleResolution: NodeNext`
- **Dependency injection**: app assembly lives in `src/app.ts` as a class hierarchy. `BaseApp` holds `db`, `config`, `providers`, `emailClient?` as fields and provides the shared `createBaseApp()` / `mountRoutes(app)` helpers plus an abstract `create()` and a `run()` that calls `serve()`. `ProdApp` / `DevApp` / `TestApp` extend it, overriding `create()` to wire mode-specific routes/middleware. `createApp(config)` is the factory: it instantiates the db/providers/emailClient, picks `ProdApp` or `DevApp` by `NODE_ENV`, calls `create()`, and returns the instance. Tests instantiate `new TestApp({ db, config, providers?, emailClient?, authMiddleware? }).create()` directly. Wire new shared state as a field on `BaseApp` (via the constructor), not as an extra argument.
- **Error responses**: `ctx.json({ error: "message" }, statusCode)`
- **HTTP status codes**: 200 GET, 201 POST, 204 DELETE, 400 validation, 401 unauth, 403 forbidden, 404 not found

## Type-Driven Design

- Use `Result<S, E>` instead of `T | undefined` for operations that can fail
- `ValidationError` bundles `message` + `status` (typed as Hono's `ContentfulStatusCode`)
- Typed Hono context via `AppEnv` and `RouteContext` (from `src/types.ts`)
- Prefer discriminated unions over exceptions for control flow
- Prefer classes over `createX(...)` factory functions for anything that implements a polymorphic interface (e.g. `EmailClient` → `ResendEmailClient` / `ConsoleEmailClient`). Instance state lives in fields instead of closure variables, the class name shows up in stack traces and errors, and the type relationship (`class Foo implements Bar`) is explicit rather than inferred from a return type. Keep factory functions only for wiring (`createApp`, `createTestApp`) where the return value is a composed object without per-instance identity.

## Testing

- Vitest, in-memory SQLite via `initDb(":memory:")`, mock auth middleware, `beforeEach` reset
- Custom matchers: `toBeAround(expected, withinMs?)` for date assertions, `toBeProperUUID()` — registered via `vitest.config.ts` → `tests/matchers.ts`
- Test type-checking: `tsconfig.test.json` extends main config, includes both `src/` and `tests/`
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
- Keep pure logic decoupled from I/O so tests can exercise it with plain inputs. If a function reads a file (or makes a network/DB call) *and* transforms the result, split it: the core takes the already-loaded value, and a thin wrapper does the I/O and delegates. Tests target the core with in-memory fixtures (no `mkdtempSync`, no HTTP mocks) and cover the wrapper with one or two I/O-path cases. Example: `extractExcerpt(content, slug, wordLimit?)` parses markdown; `extractExcerptFromPost(contentDir, slug, wordLimit?)` reads the file and calls it.
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