# zkmarek.com

zkMarek blog and comment system. Monorepo with npm workspaces.

Live at **https://zkmarek.com**

## Structure

```
blog/              # Astro static site
comments/          # Comment service (coming soon)
```

## Blog Development

```bash
npm install                        # install all workspaces
npm run dev --workspace=blog       # start dev server at localhost:4321
npm run build --workspace=blog     # build static site to blog/dist/
npm run preview --workspace=blog   # preview build locally
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
