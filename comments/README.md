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

App assembly lives in `src/app.ts` as a class hierarchy rooted at `BaseApp` — which owns `db`, `config`, `providers`, `emailClient?` and exposes `run()` (calls `serve()`). `createApp(config)` is the factory: it builds the dependencies and picks a subclass by `NODE_ENV`.

- **Production** (`ProdApp`) — OAuth providers only, secure cookies, no email client unless `RESEND_API_KEY` is set
- **Development** (`DevApp`) — adds a dev login provider (any name/email), insecure cookies, falls back to `ConsoleEmailClient` when no Resend key, exposes `/dev/emails/*` template previews
- **Test** (`TestApp`) — constructed directly in tests with `new TestApp({ db, config, providers?, emailClient?, authMiddleware? }).create()`

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
