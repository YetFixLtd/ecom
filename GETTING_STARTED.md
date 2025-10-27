# Getting Started with E-Commerce Platform

Welcome! This guide will help you get the project up and running in minutes.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [x] **PHP 8.2+** - Check: `php -v`
- [x] **Composer** - Check: `composer -V`
- [x] **Node.js 18+** - Check: `node -v`
- [x] **npm** - Check: `npm -v`
- [x] **Git** - Check: `git --version`

## 🚀 5-Minute Setup

### Step 1: Clone the Project (If Not Already)
```bash
git clone <repository-url>
cd ecom
```

### Step 2: Run Development Servers

#### Option A: Single Command (Recommended)
```bash
# macOS/Linux
./dev.sh

# Windows
dev.bat
```

This will automatically start both servers!

#### Option B: Manual Start (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
php artisan serve
```

✅ Backend should now be running at: **http://localhost:8000**

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

✅ Frontend should now be running at: **http://localhost:3000**

## ✅ Verify Installation

### Backend Verification
1. Open browser: http://localhost:8000
2. You should see Laravel welcome page

### Frontend Verification
1. Open browser: http://localhost:3000
2. You should see Next.js welcome page

### API Verification
```bash
curl http://localhost:8000/api/v1/health
```

## 📁 Project Structure Overview

```
ecom/
├── backend/              ← Laravel API (Port 8000)
├── frontend/             ← Next.js App (Port 3000)
├── documentation/        ← All documentation
├── README.md            ← Main project README
└── GETTING_STARTED.md   ← This file
```

## 🎯 What's Next?

### For Backend Development
1. Read: [documentation/BACKEND_SETUP.md](documentation/BACKEND_SETUP.md)
2. Create your first API endpoint
3. Explore: [documentation/API_DOCUMENTATION.md](documentation/API_DOCUMENTATION.md)

### For Frontend Development
1. Read: [documentation/FRONTEND_SETUP.md](documentation/FRONTEND_SETUP.md)
2. Create your first component
3. Integrate with backend API

### For Full-Stack Development
1. Read: [documentation/PROJECT_OVERVIEW.md](documentation/PROJECT_OVERVIEW.md)
2. Understand the architecture
3. Build end-to-end features

## 🛠️ Common Commands

### Backend
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
```

### Frontend
```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## 🔧 Configuration

### Backend Environment
Edit `backend/.env`:
- ✅ Already configured with SQLite
- ✅ Application key generated
- ✅ Database created and migrated

### Frontend Environment
Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Main project overview |
| [documentation/](documentation/) | Complete documentation |
| [documentation/PROJECT_OVERVIEW.md](documentation/PROJECT_OVERVIEW.md) | Architecture overview |
| [documentation/BACKEND_SETUP.md](documentation/BACKEND_SETUP.md) | Backend guide |
| [documentation/FRONTEND_SETUP.md](documentation/FRONTEND_SETUP.md) | Frontend guide |
| [documentation/API_DOCUMENTATION.md](documentation/API_DOCUMENTATION.md) | API reference |

## 🐛 Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
lsof -ti:8000 | xargs kill -9
php artisan serve
```

**Database not found:**
```bash
php artisan migrate:fresh
```

**Permission errors:**
```bash
chmod -R 775 storage bootstrap/cache
```

### Frontend Issues

**Port 3000 already in use:**
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

**Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Environment variables not working:**
- Ensure `.env.local` exists
- Restart dev server: `npm run dev`

### Connection Issues

**Frontend can't connect to backend:**
1. Verify backend is running: http://localhost:8000
2. Check `frontend/.env.local` has correct API_URL
3. Check CORS configuration in backend

## 💡 Tips

### Development Workflow
1. **Backend First**: Create API endpoints
2. **Test API**: Use Postman or curl
3. **Frontend**: Consume the API
4. **Iterate**: Refine both sides

### Best Practices
- ✅ Run tests before committing
- ✅ Format code regularly
- ✅ Keep documentation updated
- ✅ Use meaningful commit messages
- ✅ Follow coding standards

### Hot Reload
Both servers support hot reload:
- **Laravel**: Auto-reloads on file changes
- **Next.js**: Auto-reloads on file changes

## 🎓 Learning Resources

### Laravel
- [Laravel Documentation](https://laravel.com/docs)
- [Laracasts](https://laracasts.com) - Video tutorials
- [Laravel Daily](https://laraveldaily.com)

### Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Learn](https://nextjs.org/learn)
- [React Documentation](https://react.dev)

## 🚀 Ready to Build!

You're all set! Here are some ideas to get started:

1. **Create a Product Model** (Backend)
   ```bash
   cd backend
   php artisan make:model Product -mfc
   ```

2. **Create a Product Component** (Frontend)
   ```bash
   cd frontend/src/components
   mkdir product
   # Create ProductCard.tsx
   ```

3. **Build Your First Feature**
   - Create product API endpoint
   - Test with Postman
   - Display products on frontend
   - Celebrate! 🎉

## 📞 Need Help?

1. Check [documentation/](documentation/) folder
2. Review [README.md](README.md)
3. Check troubleshooting section above
4. Review error logs:
   - Backend: `backend/storage/logs/laravel.log`
   - Frontend: Browser console

## 🎉 You're Ready!

Happy coding! Start building your e-commerce platform.

---

**Next Steps:**
1. ✅ Backend running on http://localhost:8000
2. ✅ Frontend running on http://localhost:3000
3. 📖 Read the [documentation](documentation/)
4. 🚀 Start building features!

---

**Quick Links:**
- [Main README](README.md)
- [Documentation Index](documentation/README.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)

