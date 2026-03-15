# Comment System

Comment service for the zkmarek.com blog. Provides a REST API for readers to post, view, and delete comments on blog posts.

## Features

- Comments grouped by blog post slug
- Single-level threaded replies (parent_id)
- Soft delete (preserves data, hides from readers)
- OAuth login (Google, GitHub, X, Facebook, LinkedIn)
- Admin moderation (admins can delete any comment)
- CORS-restricted to blog origin in production

## Stack

- **Runtime**: Node.js + TypeScript (ESM, strict mode)
- **Framework**: Hono
- **Database**: SQLite via better-sqlite3 (WAL mode, foreign keys)
- **Testing**: Vitest

## Architecture

### 1. Routes (`src/routes/`)
Parse HTTP parameters, call validators, call DB functions, return JSON responses.

- One function per handler: `handleGetComments`, `handlePostComment`, `handleDeleteComment`
- Factory function exports the router: `commentRoutes()`
- Check auth first (`ctx.get("user")`), then validate input, then call DB
- Covered with **integration tests** using in-memory SQLite + mock auth middleware via `createTestApp`

### 2. Model / Business Logic (`src/validation.ts`, `src/result.ts`)
Small, pure, side-effect-free functions. Prefer extracting helpers over inline logic.

- Validators return `Result<S, E>` instead of booleans — caller gets both the validated value and typed error info
- Separate error cases: type check, format/pattern check, length check — each with a distinct message
- Covered with **unit tests** (`tests/validation.test.ts`)

### 3. Data Access (`src/db/`)
Split into modules by entity. Single source of truth for schema and SQL.

- `init.ts` — `initDb(path?)`, schema creation
- `users.ts` — `User`, `RawUser`, `upsertUser()`, `getUserById()`
- `comments.ts` — `Comment`, `RawComment`, `CommentWithReplies`, query functions
- `sessions.ts` — `Session`, `RawSession`, `SessionWithUser`, session CRUD + `deleteExpiredSessions()`
- `index.ts` — barrel re-exports
- `Raw*` types represent SQLite rows (dates as strings); domain types use `Date` objects
- Conversion at DB boundary via `parseDate()` / `formatDate()`
- Soft delete pattern: `deleted_at` timestamp, filter with `WHERE deleted_at IS NULL`
- Covered with **dedicated unit tests** (`tests/db/users.test.ts`, `comments.test.ts`, `sessions.test.ts`)

### 4. Configuration (`src/config.ts`)
Centralized app configuration — no scattered `process.env` reads.

- `Configuration` interface with all settings (port, CORS, OAuth secrets, session duration, etc.)
- `production` and `development` presets with sensible defaults
- `loadConfig(env?)` pure function merges env variable overrides on top of the active preset
- `NODE_ENV=production` selects the production preset; everything else uses development

### 5. Authentication (`src/auth/`)
OAuth login flow with multiple providers.

- `providers.ts` — `ProviderName` union type, `ProviderInstance` interface, `createProviders(config)` factory
- `userinfo.ts` — `UserInfo` DTO (transient OAuth profile), per-provider fetch functions
- `routes.ts` — OAuth redirect/callback handlers, session creation, cookie management

### 6. Middleware (`src/middleware/session.ts`)
Request-scoped user context via session cookies.

- Extracts `session` cookie, looks up session + user in DB
- Sets `ctx.set("user", ...)` for downstream route handlers
- Expired sessions return no user (handled by `getSessionWithUser`)

### 7. Utilities (`src/utils/dates.ts`)
Date conversion helpers for the SQLite ↔ JS Date boundary.

- `parseDate(value)` — SQLite TEXT → `Date`
- `formatDate(date)` — `Date` → SQLite TEXT
- `daysFrom(days, date?)` — date arithmetic for session expiry calculations

### 8. App Factory (`src/app.ts`)
Two entry points with shared internals.

- `createApp(db, config)` — production/development: full session middleware + real OAuth providers
- `createTestApp(db, config, options?)` — tests only: accepts optional mock `authMiddleware` and `providers`
- Shared helpers: `createBaseApp()` (DB middleware + CORS), `mountRoutes()` (all route registration)

## Type-Driven Design

- Use `Result<S, E>` (from `src/result.ts`) instead of `T | undefined` for operations that can fail
- `ValidationError` bundles `message` + `status` (typed as Hono's `ContentfulStatusCode`)
- Typed Hono context via `AppEnv` and `RouteContext` (from `src/types.ts`)
- Prefer discriminated unions over exceptions for control flow
- `Raw*` / domain type pattern: `RawUser`, `RawComment`, `RawSession` for SQLite rows; `User`, `Comment`, `Session` with `Date` fields for application code
- `Configuration` type replaces scattered `process.env` reads — single source of truth for all settings

## Naming Conventions

| Category | Convention | Examples |
|----------|-----------|----------|
| Route handlers | `handle{Verb}{Entity}` | `handleGetComments`, `handlePostComment` |
| Validators | `validate{Field}` | `validateSlug`, `validateCommentBody` |
| DB queries | `get*/create*/delete*/upsert*` | `getCommentsBySlug`, `upsertUser` |
| Route factories | `{entity}Routes` | `commentRoutes()` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_BODY_LENGTH`, `SLUG_PATTERN` |
| Types | `PascalCase` | `AppEnv`, `RouteContext`, `ValidationError` |
| Files | `kebab-case.ts` | `test-page.ts`, `validation.ts` |

## Project Conventions

- **ESM**: `"type": "module"` — always use `.js` extensions in relative imports
- **TypeScript**: `"strict": true`, target `ESNext`, `moduleResolution: NodeNext`
- **Dependency injection**: `createApp(db, config)` for prod/dev, `createTestApp(db, config, options?)` for tests
- **Testing**: Vitest, in-memory SQLite via `initDb(":memory:")`, mock auth middleware, `beforeEach` reset
- **Custom matchers**: `toBeAround(expected, withinMs?)` for date assertions, `toBeProperUUID()` — registered via `vitest.config.ts` → `tests/matchers.ts`
- **Test type-checking**: `tsconfig.test.json` extends main config, includes both `src/` and `tests/`
- **Error responses**: `ctx.json({ error: "message" }, statusCode)`
- **HTTP status codes**: 200 GET, 201 POST, 204 DELETE, 400 validation, 401 unauth, 403 forbidden, 404 not found
