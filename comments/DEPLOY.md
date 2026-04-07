# Comments Service Deployment

## Automatic (CI/CD)

Every push to `main` triggers GitHub Actions which:

1. Rsyncs `comments/` to `/var/www/comments/` (excluding `data/`, `.env`, `node_modules/`)
2. Runs `npm install --omit=dev` on the server
3. Restarts the systemd service

## Manual Deploy

```bash
./deploy/deploy-comments.sh    # from repo root
```

## First-Time Server Setup

Requires SSH access to `arbiter.zkmarek.com`:

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

## Deploy Configuration Files

- `deploy/comments.nginx.conf` — Nginx site config
- `deploy/comments.service` — systemd unit file
- `deploy/comments.env.example` — env var template
