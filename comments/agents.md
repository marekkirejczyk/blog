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

General testing rules live in the `testing` skill (`.claude/skills/testing/SKILL.md`).

- In-memory SQLite via `initDb(":memory:")`, mock auth middleware, `beforeEach` reset
- Custom matchers: `toBeAround(expected, withinMs?)` for date assertions, `toBeProperUUID()` — registered via `vitest.config.ts` → `tests/matchers.ts`
- Test type-checking: `tsconfig.test.json` extends main config, includes both `src/` and `tests/`