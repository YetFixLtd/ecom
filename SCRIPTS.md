# Development Scripts

This document describes the available scripts for running the e-commerce platform.

## 🚀 Quick Start Scripts

### `dev.sh` (macOS/Linux)
Single command to start both backend and frontend development servers.

**Usage:**
```bash
./dev.sh
```

**What it does:**
1. Checks if PHP and npm are installed
2. Starts Laravel backend on port 8000
3. Starts Next.js frontend on port 3000
4. Shows status of both servers
5. Logs output to `backend.log` and `frontend.log`
6. Stops both servers when you press Ctrl+C

**Output:**
```
🚀 Starting E-Commerce Development Servers...

📦 Starting Laravel Backend (Port 8000)...
✅ Backend started successfully on http://localhost:8000
⚛️  Starting Next.js Frontend (Port 3000)...
✅ Frontend started successfully on http://localhost:3000

🎉 All servers are running!

📍 URLs:
   Backend API:  http://localhost:8000
   Frontend App: http://localhost:3000

📝 Logs:
   Backend:  tail -f backend.log
   Frontend: tail -f frontend.log

Press Ctrl+C to stop all servers
```

**Stopping Servers:**
Press `Ctrl+C` and both servers will stop gracefully.

**Troubleshooting:**
If the script fails to start:
1. Check `backend.log` for backend errors
2. Check `frontend.log` for frontend errors
3. Ensure ports 8000 and 3000 are not in use
4. Verify dependencies are installed

---

### `dev.bat` (Windows)
Single command to start both backend and frontend development servers on Windows.

**Usage:**
```bash
dev.bat
```

**What it does:**
1. Checks if PHP and npm are installed
2. Opens a new terminal window for Laravel backend (port 8000)
3. Opens a new terminal window for Next.js frontend (port 3000)
4. Shows success message with URLs

**Output:**
Two new command windows will open:
- **Laravel Backend** - Running on http://localhost:8000
- **Next.js Frontend** - Running on http://localhost:3000

**Stopping Servers:**
Close the individual terminal windows or press `Ctrl+C` in each window.

---

## 📝 Log Files

When using `dev.sh`, logs are written to:

### `backend.log`
Contains Laravel development server output.

**View in real-time:**
```bash
tail -f backend.log
```

### `frontend.log`
Contains Next.js development server output.

**View in real-time:**
```bash
tail -f frontend.log
```

**Clear logs:**
```bash
rm backend.log frontend.log
```

---

## 🛠️ Manual Commands

If you prefer to run servers manually or need more control:

### Backend (Laravel)
```bash
cd backend
php artisan serve

# Custom port
php artisan serve --port=8080

# Custom host
php artisan serve --host=0.0.0.0
```

### Frontend (Next.js)
```bash
cd frontend
npm run dev

# Custom port
npm run dev -- -p 3001

# Turbopack (faster builds)
npm run dev -- --turbopack
```

---

## 🔧 Additional Useful Scripts

### Backend Scripts
```bash
cd backend

# Run tests
php artisan test

# Format code
./vendor/bin/pint

# Clear all caches
php artisan optimize:clear

# Run migrations
php artisan migrate

# Seed database
php artisan db:seed

# Fresh migration with seeding
php artisan migrate:fresh --seed

# View routes
php artisan route:list

# Tinker (REPL)
php artisan tinker
```

### Frontend Scripts
```bash
cd frontend

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Type check (if configured)
npm run type-check
```

---

## 🚀 Production Scripts

### Build for Production

**Backend:**
```bash
cd backend

# Install production dependencies
composer install --optimize-autoloader --no-dev

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Optimize
php artisan optimize
```

**Frontend:**
```bash
cd frontend

# Build for production
npm run build

# Start production server
npm run start
```

---

## 🐛 Troubleshooting Scripts

### Kill Processes on Ports
```bash
# Kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Check if Servers are Running
```bash
# Check backend
curl http://localhost:8000

# Check frontend
curl http://localhost:3000

# Check if ports are in use
lsof -i :8000
lsof -i :3000
```

### Reset Everything
```bash
# Backend
cd backend
php artisan optimize:clear
php artisan migrate:fresh
composer dump-autoload

# Frontend
cd frontend
rm -rf .next node_modules package-lock.json
npm install
```

---

## 📦 Package Management Scripts

### Backend (Composer)
```bash
cd backend

# Install dependencies
composer install

# Update dependencies
composer update

# Add package
composer require package/name

# Remove package
composer remove package/name

# Dump autoload
composer dump-autoload
```

### Frontend (npm)
```bash
cd frontend

# Install dependencies
npm install

# Update dependencies
npm update

# Add package
npm install package-name

# Add dev dependency
npm install -D package-name

# Remove package
npm uninstall package-name

# Audit packages
npm audit
npm audit fix
```

---

## 🧪 Testing Scripts

### Backend Tests
```bash
cd backend

# Run all tests
php artisan test

# Run specific test
php artisan test --filter=TestName

# Run tests with coverage
php artisan test --coverage

# Run tests in parallel
php artisan test --parallel
```

### Frontend Tests (when configured)
```bash
cd frontend

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

---

## 🔄 CI/CD Scripts

### GitHub Actions
Scripts are automatically run via GitHub Actions (when configured).

### Manual Deployment Checks
```bash
# Backend checks
cd backend
composer install --no-dev
php artisan config:cache
php artisan test

# Frontend checks
cd frontend
npm ci
npm run build
npm run lint
```

---

## 📊 Monitoring Scripts

### Backend Monitoring
```bash
cd backend

# View logs
tail -f storage/logs/laravel.log

# Monitor queue
php artisan queue:work --verbose

# Monitor Horizon (if installed)
php artisan horizon
```

### Frontend Monitoring
```bash
cd frontend

# Build analysis
npm run build -- --analyze

# Check bundle size
npm run build
```

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Start both servers | `./dev.sh` (Unix) or `dev.bat` (Windows) |
| Start backend only | `cd backend && php artisan serve` |
| Start frontend only | `cd frontend && npm run dev` |
| Run backend tests | `cd backend && php artisan test` |
| Run frontend tests | `cd frontend && npm test` |
| Format backend code | `cd backend && ./vendor/bin/pint` |
| Lint frontend code | `cd frontend && npm run lint` |
| View logs | `tail -f backend.log frontend.log` |
| Kill servers | Press `Ctrl+C` |

---

## 💡 Tips

1. **Use the dev script** for daily development - it's the fastest way to start
2. **Check logs** if something goes wrong - they're in `backend.log` and `frontend.log`
3. **Keep terminals open** to see real-time output
4. **Use separate terminals** if you need to run other commands while servers are running
5. **Restart servers** after major configuration changes

---

## 🆘 Common Issues

### Port Already in Use
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend
```

### Permission Denied on dev.sh
```bash
chmod +x dev.sh
```

### Scripts Not Found
Make sure you're in the project root directory:
```bash
cd /path/to/ecom
./dev.sh
```

---

**Related Documentation:**
- [GETTING_STARTED.md](GETTING_STARTED.md) - Quick setup guide
- [README.md](README.md) - Main project documentation
- [documentation/BACKEND_SETUP.md](documentation/BACKEND_SETUP.md) - Backend details
- [documentation/FRONTEND_SETUP.md](documentation/FRONTEND_SETUP.md) - Frontend details

---

**Last Updated**: October 27, 2025

