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
- **Dependency injection**: `createApp(db, config)` for prod/dev, `createTestApp(db, config, options?)` for tests
- **Error responses**: `ctx.json({ error: "message" }, statusCode)`
- **HTTP status codes**: 200 GET, 201 POST, 204 DELETE, 400 validation, 401 unauth, 403 forbidden, 404 not found

## Type-Driven Design

- Use `Result<S, E>` instead of `T | undefined` for operations that can fail
- `ValidationError` bundles `message` + `status` (typed as Hono's `ContentfulStatusCode`)
- Typed Hono context via `AppEnv` and `RouteContext` (from `src/types.ts`)
- Prefer discriminated unions over exceptions for control flow

## Testing

- Vitest, in-memory SQLite via `initDb(":memory:")`, mock auth middleware, `beforeEach` reset
- Custom matchers: `toBeAround(expected, withinMs?)` for date assertions, `toBeProperUUID()` — registered via `vitest.config.ts` → `tests/matchers.ts`
- Test type-checking: `tsconfig.test.json` extends main config, includes both `src/` and `tests/`
