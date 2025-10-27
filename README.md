# E-Commerce Platform

A modern, full-stack e-commerce application built with Laravel (backend API) and Next.js (frontend).

## 🚀 Tech Stack

### Backend
- **Framework**: Laravel 12.x
- **Language**: PHP 8.2+
- **Database**: SQLite (dev) / MySQL/PostgreSQL (production)
- **Authentication**: Laravel Sanctum
- **Testing**: PHPUnit

### Frontend
- **Framework**: Next.js 16.x (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.x
- **UI Framework**: React 19.x
- **Linting**: ESLint

## 📁 Project Structure

```
ecom/
├── backend/              # Laravel API application
│   ├── app/             # Application code
│   ├── database/        # Migrations, seeders
│   ├── routes/          # API routes
│   └── tests/           # Backend tests
│
├── frontend/            # Next.js application
│   ├── src/
│   │   ├── app/        # App router pages
│   │   ├── components/ # React components
│   │   ├── lib/        # Utilities
│   │   └── types/      # TypeScript types
│   └── public/         # Static assets
│
├── documentation/       # Project documentation
│   ├── PROJECT_OVERVIEW.md
│   ├── BACKEND_SETUP.md
│   ├── FRONTEND_SETUP.md
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_SCHEMA.md
│   ├── ENVIRONMENT_SETUP.md
│   └── DEPLOYMENT.md
│
└── README.md           # This file
```

## 🎯 Features

### Planned Features
- 🛒 Product catalog with categories
- 🔍 Advanced search and filtering
- 🛍️ Shopping cart
- 👤 User authentication and profiles
- 📦 Order management
- 💳 Payment integration (Stripe/PayPal)
- ⭐ Product reviews and ratings
- 📱 Responsive design
- 🔐 Admin dashboard
- 📧 Email notifications
- 📊 Analytics and reporting

## 🚦 Getting Started

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- npm/yarn/pnpm
- Git

### Quick Start

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd ecom
```

#### 2. Start Development Servers

**Option A: One Command (Recommended)**
```bash
# macOS/Linux
./dev.sh

# Windows
dev.bat
```

**Option B: Manual Start**

Backend:
```bash
cd backend
php artisan serve
```
Backend will run at: `http://localhost:8000`

Frontend:
```bash
cd frontend
npm run dev
```
Frontend will run at: `http://localhost:3000`

**For detailed setup**, see [documentation/BACKEND_SETUP.md](documentation/BACKEND_SETUP.md) and [documentation/FRONTEND_SETUP.md](documentation/FRONTEND_SETUP.md)

## 📚 Documentation

Comprehensive documentation is available in the `documentation/` folder:

| Document | Description |
|----------|-------------|
| [GETTING_STARTED.md](GETTING_STARTED.md) | Quick start guide (5 minutes to run!) |
| [SCRIPTS.md](SCRIPTS.md) | Development scripts and commands reference |
| [PROJECT_OVERVIEW.md](documentation/PROJECT_OVERVIEW.md) | High-level project overview and architecture |
| [BACKEND_SETUP.md](documentation/BACKEND_SETUP.md) | Backend installation and configuration guide |
| [FRONTEND_SETUP.md](documentation/FRONTEND_SETUP.md) | Frontend installation and configuration guide |
| [API_DOCUMENTATION.md](documentation/API_DOCUMENTATION.md) | Complete API endpoints reference |
| [DATABASE_SCHEMA.md](documentation/DATABASE_SCHEMA.md) | Database structure and relationships |
| [ENVIRONMENT_SETUP.md](documentation/ENVIRONMENT_SETUP.md) | Environment variables configuration |
| [DEPLOYMENT.md](documentation/DEPLOYMENT.md) | Production deployment guide |

## 🛠️ Development

### Backend Commands
```bash
# Run tests
php artisan test

# Format code
./vendor/bin/pint

# Create migration
php artisan make:migration create_products_table

# Create controller
php artisan make:controller Api/ProductController --api

# Create model
php artisan make:model Product -mfc
```

### Frontend Commands
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Type check
npm run type-check
```

## 🔗 API Endpoints

The backend API is versioned and follows RESTful conventions.

**Base URL**: `http://localhost:8000/api/v1`

### Main Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /products` - List all products
- `GET /products/{id}` - Get single product
- `GET /categories` - List categories
- `GET /cart` - Get user cart
- `POST /cart` - Add to cart
- `GET /orders` - List user orders
- `POST /orders` - Create order

**Full API documentation**: [documentation/API_DOCUMENTATION.md](documentation/API_DOCUMENTATION.md)

## 🗄️ Database

The application uses SQLite for development and supports MySQL/PostgreSQL for production.

### Main Tables
- `users` - User accounts
- `products` - Product catalog
- `categories` - Product categories
- `cart_items` - Shopping cart
- `orders` - Customer orders
- `order_items` - Order details
- `reviews` - Product reviews

**Full schema documentation**: [documentation/DATABASE_SCHEMA.md](documentation/DATABASE_SCHEMA.md)

## 🧪 Testing

### Backend Tests
```bash
cd backend
php artisan test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🚀 Deployment

### Recommended Platforms

#### Backend
- Laravel Forge
- DigitalOcean App Platform
- AWS EC2
- Heroku

#### Frontend
- Vercel (Recommended)
- Netlify
- AWS Amplify
- DigitalOcean App Platform

**Full deployment guide**: [documentation/DEPLOYMENT.md](documentation/DEPLOYMENT.md)

## 🔒 Security

- CSRF protection enabled
- SQL injection protection via Eloquent ORM
- XSS protection
- API rate limiting
- Laravel Sanctum for authentication
- Environment-based configuration
- Regular dependency updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- **PHP**: Follow PSR-12 coding standards (enforced by Laravel Pint)
- **JavaScript/TypeScript**: Follow ESLint configuration
- **Git**: Write meaningful commit messages

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Laravel community
- Next.js team
- All contributors

## 📧 Contact

For questions or support, please contact: your-email@example.com

## 📊 Project Status

**Current Phase**: Initial Setup ✅

### Completed
- ✅ Project structure initialization
- ✅ Backend (Laravel) setup
- ✅ Frontend (Next.js) setup
- ✅ Documentation structure

### In Progress
- 🚧 Database schema implementation
- 🚧 API endpoints development
- 🚧 Frontend components

### Upcoming
- ⏳ Authentication system
- ⏳ Product catalog
- ⏳ Shopping cart
- ⏳ Checkout process
- ⏳ Payment integration
- ⏳ Admin dashboard

---

## Quick Links

- [📖 Full Documentation](documentation/)
- [🔧 Backend Setup](documentation/BACKEND_SETUP.md)
- [⚛️ Frontend Setup](documentation/FRONTEND_SETUP.md)
- [🌐 API Docs](documentation/API_DOCUMENTATION.md)
- [🗄️ Database Schema](documentation/DATABASE_SCHEMA.md)
- [🚀 Deployment Guide](documentation/DEPLOYMENT.md)

---

**Built with ❤️ using Laravel and Next.js**

