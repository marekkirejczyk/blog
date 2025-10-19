# Deployment Guide

This project uses GitHub Actions for automated deployment to your server.

## Setup Instructions

### 1. Add GitHub Secrets

Go to your GitHub repository: **Settings → Secrets and variables → Actions → New repository secret**

Add the following secrets:

#### `SSH_PRIVATE_KEY`
Your SSH private key for the `www` user. To get it:
```bash
cat ~/.ssh/id_rsa
```
Copy the entire content including `-----BEGIN ... KEY-----` and `-----END ... KEY-----`

#### `SERVER_HOST`
Your server's hostname or IP address, e.g.:
- `example.com`
- `123.45.67.89`

#### `SERVER_USER`
The SSH user, should be: `www`

#### `SERVER_PATH`
The deployment path on the server: `/var/www`

### 2. Verify Server Setup

Make sure your server is ready:

```bash
# SSH into your server
ssh www@your-server.com

# Check nginx configuration points to /var/www
cat /etc/nginx/sites-enabled/default

# Verify www user has write permissions
ls -la /var/www

# If needed, fix permissions:
sudo chown -R www:www /var/www
sudo chmod -R 755 /var/www
```

### 3. Test Deployment

Once secrets are configured:

1. Push any commit to the `main` branch
2. Go to **Actions** tab in GitHub
3. Watch the "Deploy to Server" workflow run
4. Check your website at your domain

### Workflow Behavior

- **Triggers**: Automatically on push to `main` branch
- **Build**: Runs `npm ci` and `npm run build`
- **Deploy**: Uses `rsync` to sync `dist/` folder to `/var/www`
- **Clean**: The `--delete` flag removes old files from server

### Manual Deployment

If you need to deploy manually:

```bash
# Build locally
npm run build

# Deploy via rsync
rsync -avz --delete dist/ www@your-server.com:/var/www/
```

## Nginx Configuration

Make sure your nginx config serves from `/var/www`:

```nginx
server {
    listen 80;
    server_name zkmarek.com www.zkmarek.com;
    
    root /var/www;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Troubleshooting

### Deployment fails with "Permission denied"
- Check SSH key is correct in GitHub secrets
- Verify `www` user has write access to `/var/www`

### Files not updating on server
- Check the Actions log for rsync errors
- Verify `/var/www` path is correct

### 404 errors after deployment
- Ensure nginx is configured to serve from `/var/www`
- Check file permissions: `ls -la /var/www`
- Restart nginx: `sudo systemctl restart nginx`

