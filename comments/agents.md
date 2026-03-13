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

## Architecture: Three Layers

### 1. Routes (`src/routes/`)
Parse HTTP parameters, call validators, call DB functions, return JSON responses.

- One function per handler: `handleGetComments`, `handlePostComment`, `handleDeleteComment`
- Factory function exports the router: `commentRoutes()`
- Check auth first (`ctx.get("user")`), then validate input, then call DB
- Covered with **integration tests** using in-memory SQLite + mock auth middleware via `createApp(db, options)`

### 2. Model / Business Logic (`src/validation.ts`, `src/result.ts`)
Small, pure, side-effect-free functions. Prefer extracting helpers over inline logic.

- Validators return `Result<S, E>` instead of booleans — caller gets both the validated value and typed error info
- Separate error cases: type check, format/pattern check, length check — each with a distinct message
- Covered with **unit tests** (`tests/validation.test.ts`)

### 3. Data Access (`src/db.ts`)
Data types and query functions. Single source of truth for schema and SQL.

- Types: `User`, `Comment`, `CommentWithReplies`
- Access functions: `getCommentsBySlug`, `createComment`, `deleteComment`, `upsertUser`, `getCommentById`
- Soft delete pattern: `deleted_at` timestamp, filter with `WHERE deleted_at IS NULL`
- Covered with **integration/roundtrip tests** via the route-level tests

## Type-Driven Design

- Use `Result<S, E>` (from `src/result.ts`) instead of `T | undefined` for operations that can fail
- `ValidationError` bundles `message` + `status` (typed as Hono's `ContentfulStatusCode`)
- Typed Hono context via `AppEnv` and `RouteContext` (from `src/types.ts`)
- Prefer discriminated unions over exceptions for control flow

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
- **Dependency injection**: `createApp(db, options?)` factory — DB and auth middleware passed as params
- **Testing**: Vitest, in-memory SQLite via `initDb(":memory:")`, mock auth middleware, `beforeEach` reset
- **Error responses**: `ctx.json({ error: "message" }, statusCode)`
- **HTTP status codes**: 200 GET, 201 POST, 204 DELETE, 400 validation, 401 unauth, 403 forbidden, 404 not found
