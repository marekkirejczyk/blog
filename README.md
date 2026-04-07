# zkmarek.com

Blog and comment system. Monorepo with npm workspaces.

Live at **https://zkmarek.com**

## Structure

```
blog/        Astro static site           → blog/README.md
comments/    Comment service (Hono)      → comments/README.md
deploy/      Server config & scripts
```

## Quick Start

```bash
npm install          # install all workspaces
npm run dev          # start both dev servers (blog :4321, comments :3001)
npm run build        # build blog static site
npm test             # run all tests
```

## Deployment

Both projects deploy automatically on push to `main` via GitHub Actions.

- [Blog deployment](blog/DEPLOY.md)
- [Comments deployment](comments/DEPLOY.md)
