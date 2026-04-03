# zkmarek.com

zkMarek blog and comment system. Monorepo with npm workspaces.

Live at **https://zkmarek.com**

## Structure

```
blog/              # Astro static site
comments/          # Comment service API (Hono + SQLite)
```

## Blog Development

```bash
npm install                        # install all workspaces
npm run dev --workspace=blog       # start dev server at localhost:4321
npm run build --workspace=blog     # build static site to blog/dist/
npm run preview --workspace=blog   # preview build locally
npm test --workspace=blog          # run tests
```

## Deployment

Deploys via rsync to a Hetzner server (`arbiter.zkmarek.com`) as the `deploy` user (non-root).

```bash
npm run deploy --workspace=blog    # build + rsync to production (manual)
```

Every push to `main` also triggers automatic deployment via GitHub Actions.

### Server setup

- **Host**: `arbiter.zkmarek.com` (Hetzner, DNS-only via Cloudflare — no proxy)
- **Nginx** serves static files from `/var/www/static`
- **SSL** via Let's Encrypt (managed by Certbot)
- **Deploy user** owns `/var/www/static`, SSH access with `~/.ssh/id_ed25519`
- **CI/CD**: GitHub Actions deploys on push to `main` (SSH key stored in `DEPLOY_SSH_KEY` secret)

## Blog project structure

```
blog/
  src/
    content/blog/    # markdown posts (content collection)
    layouts/         # BaseLayout, BlogPost
    pages/           # index + blog/[...slug]
    styles/          # global CSS
  public/images/     # static assets (cover images, etc.)
  import/            # Medium HTML exports (source data, not deployed)
  scripts/           # conversion scripts
```

## Adding a post

Create a markdown file in `blog/src/content/blog/`:

```markdown
---
title: "Post Title"
date: "2025-01-01"
description: "Short summary"
heroImage: "/images/my-cover.svg"
---

Post content here.
```

Then `npm run deploy --workspace=blog` to publish.

## Comment Service

Hono + SQLite API for blog comments with OAuth login. Runs on port 3001.

### Development

```bash
npm run dev --workspace=comments      # start with auto-reload (localhost:3001)
npm test --workspace=comments         # run tests
npm test -- --watch --workspace=comments  # tests in watch mode
```

Test page at http://localhost:3001/test

### App modes

Three app factory functions in `comments/src/app.ts`, selected by `NODE_ENV`:

- **Production** (`createApp`) — OAuth providers only, secure cookies, used when `NODE_ENV=production`
- **Development** (`createDevApp`) — adds a dev login provider (any name/email), insecure cookies, default mode
- **Test** (`createTestApp`) — accepts mock auth middleware and providers, used in tests

### Configuration

Defaults switch on `NODE_ENV` (see `comments/src/config.ts`). Override with env vars:

| Variable | Dev default | Prod default |
|---|---|---|
| `PORT` | 3001 | 3001 |
| `DATABASE_PATH` | `./data/comments.db` | `./data/comments.db` |
| `CORS_ORIGIN` | `http://localhost:4321` | `https://zkmarek.com` |
| `BLOG_URL` | `http://localhost:4321` | `https://zkmarek.com` |

OAuth providers (set both ID + secret to enable):
`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `X_CLIENT_ID`, `X_CLIENT_SECRET`

### Project structure

```
comments/
  src/
    auth/          # OAuth provider setup, userinfo fetchers
    db/            # SQLite schema, user/session/comment queries
    middleware/    # session middleware
    routes/        # auth, comments, dev-auth, test-page
  tests/           # Vitest tests (mirrors src/ structure)
```
