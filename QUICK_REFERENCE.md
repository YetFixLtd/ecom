# Quick Reference Card

## 🚀 Start Development

### Single Command (Easiest!)
```bash
# macOS/Linux
./dev.sh

# Windows
dev.bat
```

### Manual Start
```bash
# Terminal 1 - Backend
cd backend && php artisan serve

# Terminal 2 - Frontend
cd frontend && npm run dev
```

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Base URL | http://localhost:8000/api/v1 |

---

## 📂 Project Structure

```
ecom/
├── backend/           # Laravel API (Port 8000)
├── frontend/          # Next.js App (Port 3000)
├── documentation/     # Full documentation
├── dev.sh            # Start script (Unix)
└── dev.bat           # Start script (Windows)
```

---

## 🛠️ Common Commands

### Backend (Laravel)
```bash
cd backend

# Start server
php artisan serve

# Run migrations
php artisan migrate

# Run tests
php artisan test

# Format code
./vendor/bin/pint

# View routes
php artisan route:list

# Clear cache
php artisan optimize:clear
```

### Frontend (Next.js)
```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Start production
npm run start
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill backend (port 8000)
lsof -ti:8000 | xargs kill -9

# Kill frontend (port 3000)
lsof -ti:3000 | xargs kill -9
```

### Reset Everything
```bash
# Backend
cd backend
php artisan optimize:clear
php artisan migrate:fresh

# Frontend
cd frontend
rm -rf .next
npm run dev
```

### View Logs
```bash
# When using dev.sh
tail -f backend.log
tail -f frontend.log

# Laravel logs
tail -f backend/storage/logs/laravel.log
```

---

## 📝 Key Files

### Configuration Files
| File | Purpose |
|------|---------|
| `backend/.env` | Backend environment |
| `frontend/.env.local` | Frontend environment |
| `backend/routes/api.php` | API routes |
| `frontend/next.config.ts` | Next.js config |

### Documentation Files
| File | Purpose |
|------|---------|
| [README.md](README.md) | Main overview |
| [GETTING_STARTED.md](GETTING_STARTED.md) | Quick setup |
| [SCRIPTS.md](SCRIPTS.md) | Scripts reference |
| [documentation/](documentation/) | Full docs |

---

## 🎯 Quick Tasks

### Create New API Endpoint
```bash
cd backend
php artisan make:controller Api/ExampleController --api
# Edit: backend/app/Http/Controllers/Api/ExampleController.php
# Add route: backend/routes/api.php
```

### Create New Frontend Page
```bash
cd frontend/src/app
mkdir new-page
# Create: new-page/page.tsx
```

### Create Database Table
```bash
cd backend
php artisan make:migration create_table_name
# Edit: backend/database/migrations/[timestamp]_create_table_name.php
php artisan migrate
```

### Create Model with Migration
```bash
cd backend
php artisan make:model ModelName -mfc
# -m: migration, -f: factory, -c: controller
```

---

## 🔗 Quick Links

- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **Laravel Docs**: https://laravel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind Docs**: https://tailwindcss.com/docs

---

## 💡 Tips

✅ Use `./dev.sh` to start both servers at once  
✅ Keep logs open: `tail -f backend.log frontend.log`  
✅ Run tests before committing  
✅ Format code regularly  
✅ Check documentation for detailed guides  

---

## 🆘 Need Help?

1. Check [GETTING_STARTED.md](GETTING_STARTED.md)
2. Read [SCRIPTS.md](SCRIPTS.md)
3. Browse [documentation/](documentation/)
4. Check error logs
5. Review [README.md](README.md)

---

**Keep this file handy for quick reference!**

Last Updated: October 27, 2025

