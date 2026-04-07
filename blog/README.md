# Blog (zkmarek.com)

Astro static site for [zkmarek.com](https://zkmarek.com).

## Development

```bash
npm install          # from repo root
npm run dev          # dev server at localhost:4321
npm run build        # build static site to dist/
npm run preview      # preview build locally
npm test             # run tests
```

## Project Structure

```
src/
  content/blog/      # markdown posts (content collection)
  layouts/           # BaseLayout, BlogPost
  pages/             # index + blog/[...slug]
  styles/            # global CSS
public/images/       # static assets (cover images, etc.)
import/              # Medium HTML exports (source data, not deployed)
scripts/             # conversion scripts
```

## Adding a Post

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

Then deploy to publish (see [DEPLOY.md](DEPLOY.md)).
