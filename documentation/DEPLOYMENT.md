# Deployment Guide

## Overview
This guide covers deployment strategies for the e-commerce application with Laravel backend and Next.js frontend.

---

## Deployment Options

### Option 1: Separate Deployments (Recommended)
- **Backend (Laravel)**: Deploy to a server/platform that supports PHP
- **Frontend (Next.js)**: Deploy to a platform optimized for Node.js/React

### Option 2: Monorepo Deployment
- Deploy both applications on the same server with reverse proxy configuration

---

## Backend Deployment (Laravel)

### Prerequisites
- PHP 8.2+
- Composer
- MySQL/PostgreSQL database
- Web server (Apache/Nginx)

### Platform Options

#### 1. Laravel Forge (Recommended for Laravel)
```bash
# Connect your server to Forge
# Configure deployment script
# Set up environment variables
# Enable quick deployments
```

#### 2. DigitalOcean App Platform
```bash
# Connect GitHub repository
# Configure build command: composer install --optimize-autoloader --no-dev
# Configure run command: php artisan serve --host=0.0.0.0 --port=8080
```

#### 3. AWS EC2 / DigitalOcean Droplet

**Server Setup:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PHP 8.2
sudo apt install php8.2 php8.2-cli php8.2-fpm php8.2-mysql php8.2-xml php8.2-mbstring php8.2-curl php8.2-zip -y

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Nginx
sudo apt install nginx -y

# Install MySQL
sudo apt install mysql-server -y
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /var/www/ecom/backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

#### 4. Heroku
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create your-ecom-api

# Add buildpack
heroku buildpacks:set heroku/php

# Set config vars
heroku config:set APP_KEY=$(php artisan key:generate --show)
heroku config:set APP_ENV=production
heroku config:set APP_DEBUG=false

# Add database
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git push heroku main
```

### Deployment Steps

#### 1. Prepare for Production
```bash
# Update .env for production
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_PORT=3306
DB_DATABASE=your-database
DB_USERNAME=your-username
DB_PASSWORD=your-password
```

#### 2. Optimize Application
```bash
# Install dependencies
composer install --optimize-autoloader --no-dev

# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize
php artisan optimize
```

#### 3. Run Migrations
```bash
php artisan migrate --force
```

#### 4. Set Permissions
```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

#### 5. Configure Queue Worker (Optional)
```bash
# Install Supervisor
sudo apt install supervisor

# Create supervisor config
sudo nano /etc/supervisor/conf.d/laravel-worker.conf
```

**Supervisor Configuration:**
```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/ecom/backend/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
user=www-data
numprocs=8
redirect_stderr=true
stdout_logfile=/var/www/ecom/backend/storage/logs/worker.log
```

```bash
# Start supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*
```

#### 6. Configure Task Scheduler
```bash
# Add to crontab
crontab -e

# Add this line
* * * * * cd /var/www/ecom/backend && php artisan schedule:run >> /dev/null 2>&1
```

---

## Frontend Deployment (Next.js)

### Platform Options

#### 1. Vercel (Recommended for Next.js)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel

# Production deployment
vercel --prod
```

**Environment Variables (Vercel Dashboard):**
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_APP_NAME=E-Commerce Store
```

#### 2. Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd frontend
netlify deploy --prod
```

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

#### 3. AWS Amplify
- Connect GitHub repository
- Configure build settings
- Set environment variables
- Deploy automatically on push

#### 4. DigitalOcean App Platform
```yaml
# .do/app.yaml
name: ecom-frontend
services:
  - name: frontend
    github:
      repo: your-username/ecom
      branch: main
      deploy_on_push: true
    build_command: npm run build
    run_command: npm run start
    envs:
      - key: NEXT_PUBLIC_API_URL
        value: https://api.yourdomain.com/api/v1
    http_port: 3000
```

#### 5. Docker + Any Cloud Provider

**Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

**Build and Deploy:**
```bash
# Build image
docker build -t ecom-frontend .

# Run container
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1 ecom-frontend
```

---

## SSL/TLS Configuration

### Using Let's Encrypt (Free SSL)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

---

## CI/CD Pipeline

### GitHub Actions

**Backend (.github/workflows/backend.yml):**
```yaml
name: Backend CI/CD

on:
  push:
    branches: [ main ]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
      
      - name: Install Dependencies
        working-directory: ./backend
        run: composer install --prefer-dist --no-dev
      
      - name: Run Tests
        working-directory: ./backend
        run: php artisan test
      
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/ecom/backend
            git pull origin main
            composer install --optimize-autoloader --no-dev
            php artisan migrate --force
            php artisan config:cache
            php artisan route:cache
            php artisan view:cache
```

**Frontend (.github/workflows/frontend.yml):**
```yaml
name: Frontend CI/CD

on:
  push:
    branches: [ main ]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install Dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
```

---

## Monitoring & Logging

### Backend (Laravel)
```bash
# Install Laravel Telescope (for development/staging)
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate

# Production logging - Use services like:
# - Sentry (error tracking)
# - New Relic (performance monitoring)
# - Papertrail (log management)
```

### Frontend (Next.js)
```bash
# Install Sentry for error tracking
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard -i nextjs
```

---

## Performance Optimization

### Backend
1. Enable OPcache in PHP
2. Use Redis for cache and sessions
3. Enable HTTP/2
4. Use CDN for static assets
5. Optimize database queries
6. Use queue workers for heavy tasks

### Frontend
1. Enable image optimization
2. Use CDN for static assets
3. Enable compression (gzip/brotli)
4. Implement proper caching headers
5. Use Next.js Image optimization
6. Code splitting and lazy loading

---

## Backup Strategy

### Database Backup
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u username -p database_name > /backups/db_$DATE.sql
# Upload to S3
aws s3 cp /backups/db_$DATE.sql s3://your-backup-bucket/

# Schedule in crontab
0 2 * * * /path/to/backup-script.sh
```

### File Storage Backup
```bash
# Sync storage to S3
aws s3 sync /var/www/ecom/backend/storage/app s3://your-storage-bucket/
```

---

## Rollback Plan

### Backend
```bash
# Revert to previous commit
git revert HEAD
git push

# Or checkout previous version
git checkout <commit-hash>

# Run migrations rollback if needed
php artisan migrate:rollback
```

### Frontend
```bash
# Vercel: Rollback from dashboard
# Or redeploy previous commit
git checkout <commit-hash>
vercel --prod
```

---

## Security Checklist

- [ ] SSL/TLS enabled
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection protection (using Eloquent)
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Regular security updates
- [ ] Firewall configured
- [ ] Backup strategy in place
- [ ] Monitoring and alerting set up

---

**Last Updated**: October 27, 2025
**Deployment Status**: Pre-deployment Phase

