# Blog Deployment

## Automatic (CI/CD)

Every push to `main` triggers GitHub Actions which:

1. Installs dependencies and runs tests
2. Builds the static site
3. Rsyncs `blog/dist/` to `/var/www/static/` on the server

## Manual Deploy

```bash
npm run deploy       # builds + rsyncs to production
```

## Server Info

- **Host**: `arbiter.zkmarek.com` (Hetzner, DNS-only via Cloudflare)
- **Nginx** serves static files from `/var/www/static`
- **SSL** via Let's Encrypt (managed by Certbot)
- **Deploy user** owns `/var/www/static`, SSH access with `~/.ssh/id_ed25519`
- **CI/CD**: GitHub Actions SSH key stored in `DEPLOY_SSH_KEY` secret
