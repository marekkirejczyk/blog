# zkmarek.com

Personal blog by Marek Kirejczyk. Static site built with [Astro](https://astro.build), served from a Hetzner dedicated server.

Live at **https://zkmarek.com**

## Development

```bash
npm install        # install dependencies
npm run dev        # start dev server at localhost:4321
npm run build      # build static site to dist/
npm run preview    # preview build locally
```

## Deployment

Deploys via rsync to a Hetzner server (`arbiter.zkmarek.com`) as the `deploy` user (non-root).

```bash
npm run deploy     # build + rsync to production
```

### Server setup

- **Host**: `arbiter.zkmarek.com` (Hetzner, DNS-only via Cloudflare — no proxy)
- **Nginx** serves static files from `/var/www/static`
- **SSL** via Let's Encrypt (managed by Certbot)
- **Deploy user** owns `/var/www/static`, SSH access with `~/.ssh/id_ed25519`

## Project structure

```
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

Create a markdown file in `src/content/blog/`:

```markdown
---
title: "Post Title"
date: "2025-01-01"
description: "Short summary"
heroImage: "/images/my-cover.svg"
---

Post content here.
```

Then `npm run deploy` to publish.
