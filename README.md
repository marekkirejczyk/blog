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
- **Nginx** serves static files from `/var/www/static`, proxies `comments.zkmarek.com` to port 3001
- **SSL** via Let's Encrypt (managed by Certbot)
- **Deploy user** owns `/var/www/static` and `/var/www/comments`, SSH access with `~/.ssh/id_ed25519`
- **CI/CD**: GitHub Actions deploys both blog and comments on push to `main` (SSH key stored in `DEPLOY_SSH_KEY` secret)

### Comments service server setup

First-time setup on the server (requires SSH access):

```bash
# 1. DNS: Add A record for comments.zkmarek.com → server IP (Cloudflare, DNS-only)

# 2. Create directory
sudo mkdir -p /var/www/comments/data
sudo chown -R deploy:deploy /var/www/comments

# 3. Install nginx config
sudo cp /var/www/comments/deploy/comments.nginx.conf /etc/nginx/sites-available/comments
sudo ln -s /etc/nginx/sites-available/comments /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 4. SSL certificate
sudo certbot --nginx -d comments.zkmarek.com

# 5. Create .env with OAuth secrets (see deploy/comments.env.example)
nano /var/www/comments/.env

# 5. Or copy files from local folder
scp ./comments/.env deploy@arbiter.zkmarek.com:/var/www/comments/.env

# 6. Install and start systemd service
sudo cp /var/www/comments/deploy/comments.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now comments

# 7. Allow deploy user to restart service without password
echo "deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart comments" | sudo tee /etc/sudoers.d/comments
```

After this, every push to `main` automatically deploys both blog and comments. Manual deploy:

```bash
./deploy/deploy-comments.sh
```

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
