# Comments System Specification

Readers can post comments on blog posts, reply to other comments, and delete their own comments. Authentication is via OAuth providers. The system consists of a REST API (`comments/`) and a frontend widget embedded in the Astro blog (`blog/`).

## User Flows

### Viewing Comments

Any visitor can view comments on a blog post. Comments are grouped by post slug and displayed in chronological order. Replies are nested one level under their parent.

### Logging In

1. Visitor clicks a provider button (GitHub, Google, etc.)
2. Browser redirects to the OAuth provider's authorization page
3. After approval, the provider redirects back to `/auth/:provider/callback`
4. The API creates or updates the user record and issues a session cookie
5. Browser redirects back to the blog post (stored in `oauth_redirect` cookie)

In development mode, a "Dev" provider is available that accepts any name and email via a form.

### Posting a Comment

Authenticated users can write a comment (max 2000 characters) on any post. They can also reply to an existing comment, creating a single-level thread.

### Deleting a Comment

Users can delete their own comments. Admins can delete any comment. Deletion is soft (sets `deleted_at`), hiding the comment from readers but preserving data.

### Logging Out

Destroys the server-side session and clears the session cookie.

## REST API

Base URL: `https://comments.zkmarek.com` (production), `http://localhost:3001` (development)

### GET /auth/providers

Returns available login providers.

```json
{ "providers": ["github", "google"] }
```

### GET /auth/:provider

Initiates OAuth login. Accepts optional `?redirect=<url>` to return the user to a specific page after login. Redirects to the provider's authorization page.

### GET /auth/:provider/callback

OAuth callback. Validates state, exchanges code for token, fetches user info, creates session, redirects to the stored redirect URL or blog home.

### GET /auth/me

Returns the current user or null.

```json
{ "user": { "id": 1, "name": "Alice", "avatar_url": "https://...", "is_admin": false } }
```

```json
{ "user": null }
```

### POST /auth/logout

Destroys session. Returns `{ "ok": true }`.

### GET /comments?slug=:slug

Returns comments for a blog post, with replies nested under their parent.

```json
{
  "comments": [
    {
      "id": 1,
      "slug": "my-post",
      "body": "Great post!",
      "author_name": "Alice",
      "author_avatar": "https://...",
      "user_id": 1,
      "created_at": "2025-06-01T12:00:00.000Z",
      "replies": [
        {
          "id": 2,
          "body": "Thanks!",
          "author_name": "Bob",
          "author_avatar": null,
          "user_id": 2,
          "created_at": "2025-06-01T13:00:00.000Z",
          "replies": []
        }
      ]
    }
  ]
}
```

### POST /comments

Creates a comment. Requires authentication.

Request:
```json
{ "slug": "my-post", "body": "Nice article!", "parent_id": 1 }
```
`parent_id` is optional (omit for top-level comments).

Response: `201` with the created comment object.

### DELETE /comments/:id

Soft-deletes a comment. Requires authentication. Users can only delete their own comments; admins can delete any.

Response: `204` (no body).

## Validation Rules

| Field | Rule |
|---|---|
| `slug` | Lowercase letters, numbers, and dashes only (`/^[a-z0-9-]+$/`) |
| `body` | Non-empty string, max 2000 characters, trimmed |
| `parent_id` | Must reference an existing, non-deleted comment |

## Error Responses

All errors return JSON: `{ "error": "message" }`

| Status | Meaning |
|---|---|
| 400 | Validation error (bad slug, empty body, invalid parent) |
| 401 | Not authenticated |
| 403 | Not authorized (deleting another user's comment) |
| 404 | Comment not found |

## Database Schema

Three tables in SQLite:

- **users** — `id`, `provider`, `provider_id`, `name`, `email`, `avatar_url`, `is_admin`, `created_at`. Unique on `(provider, provider_id)`.
- **comments** — `id`, `slug`, `user_id`, `parent_id`, `body`, `created_at`, `deleted_at`. Indexed on `(slug, created_at)` and `parent_id`.
- **sessions** — `id` (UUID), `user_id`, `created_at`, `expires_at`. Sessions expire after 30 days.

`Raw*` types (`RawUser`, `RawComment`, `RawSession`) represent SQLite rows with dates as strings. Domain types (`User`, `Comment`, `Session`) use `Date` objects. Conversion happens at the DB boundary via `parseDate()` / `formatDate()`.

Soft delete pattern: `deleted_at` timestamp, filtered with `WHERE deleted_at IS NULL`.

## Architecture

### Routes (`comments/src/routes/`)

Parse HTTP parameters, call validators, call DB functions, return JSON responses.

- One function per handler: `handleGetComments`, `handlePostComment`, `handleDeleteComment`
- Factory function exports the router: `commentRoutes()`
- Check auth first (`ctx.get("user")`), then validate input, then call DB

### Validation (`comments/src/validation.ts`)

Pure, side-effect-free functions. Validators return `Result<S, E>` instead of booleans, so the caller gets both the validated value and a typed error. Separate error cases (type check, format check, length check) each produce a distinct message.

### Data Access (`comments/src/db/`)

Split by entity:

- `init.ts` — `initDb(path?)`, schema creation
- `users.ts` — `upsertUser()`, `getUserById()`
- `comments.ts` — `getCommentsBySlug()`, `createComment()`, `deleteComment()`, `getCommentById()`
- `sessions.ts` — `createSession()`, `getSessionWithUser()`, `deleteSession()`, `deleteExpiredSessions()`

### Authentication (`comments/src/auth/`)

- `providers.ts` — `ProviderName` union, `ProviderInstance` interface, `createProviders(config)` factory
- `userinfo.ts` — `UserInfo` DTO, per-provider fetch functions
- `routes/auth.ts` — OAuth redirect/callback handlers, session creation, cookie management

### Middleware (`comments/src/middleware/session.ts`)

Extracts `session_id` cookie, looks up session + user in DB, sets `ctx.set("user", ...)` for downstream handlers. Expired sessions return no user.

### Configuration (`comments/src/config.ts`)

`Configuration` interface with all settings. `production` and `development` presets. `loadConfig(env?)` merges env overrides on top of the active preset. `NODE_ENV=production` selects production; everything else uses development.

### App Factory (`comments/src/app.ts`)

- `createApp(db, config)` — production: session middleware + real OAuth providers
- `createDevApp(db, config)` — development: adds dev login provider and overrides `/auth/providers`
- `createTestApp(db, config, options?)` — tests: accepts optional mock `authMiddleware` and `providers`
- Shared helpers: `createBaseApp()` (DB middleware + CORS), `mountRoutes()` (route registration)

### Utilities (`comments/src/utils/dates.ts`)

- `parseDate(value)` — SQLite TEXT to `Date`
- `formatDate(date)` — `Date` to SQLite TEXT
- `daysFrom(days, date?)` — date arithmetic for session expiry

## Blog Integration

### How comments appear on posts

Every blog post is rendered by `blog/src/pages/blog/[...slug].astro`, which passes the post slug to the `BlogPost` layout. The layout renders `<Comments slug={slug} />` after the post content.

The slug is derived from the markdown filename: `blog/src/content/blog/my-post.md` becomes slug `my-post`.

### Environment configuration

The API base URL comes from the `PUBLIC_COMMENTS_API` env var, loaded automatically by Astro from `.env` files:

- `blog/.env.development` — `PUBLIC_COMMENTS_API=http://localhost:3001`
- `blog/.env.production` — `PUBLIC_COMMENTS_API=https://comments.zkmarek.com`

The component reads it at build time and passes it to the client-side script via a `data-api-base` attribute on the section element.

### Component structure (`blog/src/components/Comments.astro`)

The Astro component has three parts:

- **HTML** — static shell: auth bar, compose form, comments list container
- **`<script>`** — client-side JS that imports from the lib modules, reads `data-slug` and `data-api-base` from the DOM, and wires up event listeners
- **`<style>`** — scoped CSS using `:global()` selectors for JS-generated DOM elements (Astro scoped styles don't apply to dynamically created elements)

### Client-side modules

- **`blog/src/lib/comments/ui.ts`** — pure functions (no DOM, no fetch): `esc()` for HTML escaping, `timeAgo()` for relative timestamps, `renderComment()` to produce comment HTML strings. Types `Comment` and `User` are defined here.
- **`blog/src/lib/comments/api.ts`** — API client wrapping `fetch()` with `credentials: "include"`: `fetchCurrentUser`, `fetchProviders`, `fetchComments`, `postComment`, `deleteComment`, `logout`. Imports types from `ui.ts`.

### Widget behavior

On page load, the script runs two parallel requests:

1. `fetchCurrentUser` — if logged in, shows user info + logout link + compose form; otherwise shows login provider buttons
2. `fetchComments` — renders the comment list, or "No comments yet" if empty

Login buttons link to `{apiBase}/auth/{provider}?redirect={currentPageUrl}`, so after OAuth the user returns to the same blog post.

### Testing

- **`blog/tests/comments/ui.test.ts`** — unit tests for pure rendering functions (exact HTML matching)
- **`blog/tests/comments/api.test.ts`** — integration tests: API client calls go through a real Hono app via `createTestApp` with in-memory SQLite (no mocked fetch)

## Cross-Origin Setup

The blog and API run on different origins. The API sets CORS headers allowing the blog origin with credentials. Session cookies use `SameSite=None; Secure` in production and `SameSite=Lax` in development.

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
