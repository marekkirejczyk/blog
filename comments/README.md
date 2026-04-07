# Comments Service

Hono + SQLite API for blog comments with OAuth login. Runs on port 3001.

## Development

```bash
npm install              # from repo root
npm run dev              # start with auto-reload (localhost:3001)
npm run start            # production mode
npm test                 # run tests
npm run test:watch       # tests in watch mode
```

Test page at http://localhost:3001/test

## App Modes

Three app factory functions in `src/app.ts`, selected by `NODE_ENV`:

- **Production** (`createApp`) — OAuth providers only, secure cookies, used when `NODE_ENV=production`
- **Development** (`createDevApp`) — adds a dev login provider (any name/email), insecure cookies, default mode
- **Test** (`createTestApp`) — accepts mock auth middleware and providers, used in tests

## Configuration

Defaults switch on `NODE_ENV` (see `src/config.ts`). Override with env vars:

| Variable | Dev default | Prod default |
|---|---|---|
| `PORT` | 3001 | 3001 |
| `DATABASE_PATH` | `./data/comments.db` | `./data/comments.db` |
| `CORS_ORIGIN` | `http://localhost:4321` | `https://zkmarek.com` |
| `BLOG_URL` | `http://localhost:4321` | `https://zkmarek.com` |

OAuth providers (set both ID + secret to enable):
`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `X_CLIENT_ID`, `X_CLIENT_SECRET`

## Project Structure

```
src/
  auth/          # OAuth provider setup, userinfo fetchers
  db/            # SQLite schema, user/session/comment queries
  middleware/    # session middleware
  routes/        # auth, comments, dev-auth, test-page
tests/           # Vitest tests (mirrors src/ structure)
```

See [DEPLOY.md](DEPLOY.md) for deployment instructions.
