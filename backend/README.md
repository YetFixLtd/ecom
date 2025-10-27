# E-Commerce Backend (Laravel)

Laravel-based RESTful API for the e-commerce platform.

## 🚀 Quick Start

### Prerequisites
- PHP 8.2 or higher
- Composer
- SQLite/MySQL/PostgreSQL

### Installation

1. **Install dependencies**
```bash
composer install
```

2. **Configure environment**
```bash
cp .env.example .env
php artisan key:generate
```

3. **Run migrations**
```bash
php artisan migrate
```

4. **Start development server**
```bash
php artisan serve
```

Server will run at: `http://localhost:8000`

## 📁 Project Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/     # API controllers
│   │   ├── Middleware/      # Custom middleware
│   │   └── Requests/        # Form requests
│   ├── Models/              # Eloquent models
│   └── Services/            # Business logic
├── config/                  # Configuration files
├── database/
│   ├── migrations/          # Database migrations
│   ├── seeders/             # Database seeders
│   └── factories/           # Model factories
├── routes/
│   ├── api.php             # API routes
│   └── web.php             # Web routes
├── storage/                 # File storage
└── tests/                   # Tests
```

## 🔧 Configuration

### Database
Edit `.env` file:

**SQLite (Default)**:
```env
DB_CONNECTION=sqlite
```

**MySQL**:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ecommerce
DB_USERNAME=root
DB_PASSWORD=
```

### CORS
Configure allowed origins in `.env`:
```env
FRONTEND_URL=http://localhost:3000
```

## 🛠️ Development

### Common Commands

```bash
# Run development server
php artisan serve

# Run migrations
php artisan migrate

# Rollback migrations
php artisan migrate:rollback

# Fresh migration with seeding
php artisan migrate:fresh --seed

# Create controller
php artisan make:controller Api/ProductController --api

# Create model with migration and factory
php artisan make:model Product -mf

# Create migration
php artisan make:migration create_products_table

# Create seeder
php artisan make:seeder ProductSeeder

# Run tests
php artisan test

# Format code
./vendor/bin/pint

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# View routes
php artisan route:list
```

## 🌐 API Endpoints

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
```

### Products
```
GET    /api/v1/products
GET    /api/v1/products/{id}
POST   /api/v1/products        (Admin)
PUT    /api/v1/products/{id}   (Admin)
DELETE /api/v1/products/{id}   (Admin)
```

### Categories
```
GET /api/v1/categories
```

### Cart
```
GET    /api/v1/cart
POST   /api/v1/cart
PUT    /api/v1/cart/{id}
DELETE /api/v1/cart/{id}
```

### Orders
```
GET  /api/v1/orders
GET  /api/v1/orders/{id}
POST /api/v1/orders
```

**Full API documentation**: [../documentation/API_DOCUMENTATION.md](../documentation/API_DOCUMENTATION.md)

## 🗄️ Database

### Run Migrations
```bash
php artisan migrate
```

### Seed Database
```bash
php artisan db:seed
```

### Fresh Start
```bash
php artisan migrate:fresh --seed
```

## 🧪 Testing

### Run All Tests
```bash
php artisan test
```

### Run Specific Test
```bash
php artisan test --filter ProductTest
```

### Run with Coverage
```bash
php artisan test --coverage
```

## 📦 Key Packages

- **Laravel Framework** - Core framework
- **Laravel Sanctum** - API authentication
- **Laravel Pint** - Code formatting
- **PHPUnit** - Testing framework

## 🔐 Security

- CSRF protection enabled
- SQL injection protection via Eloquent
- XSS protection
- Rate limiting on API routes
- Environment-based configuration

## 📚 Documentation

For detailed documentation, see:
- [Backend Setup Guide](../documentation/BACKEND_SETUP.md)
- [API Documentation](../documentation/API_DOCUMENTATION.md)
- [Database Schema](../documentation/DATABASE_SCHEMA.md)
- [Deployment Guide](../documentation/DEPLOYMENT.md)

## 🐛 Troubleshooting

### Permission Issues
```bash
chmod -R 775 storage bootstrap/cache
```

### Clear All Caches
```bash
php artisan optimize:clear
```

### Database Issues
```bash
php artisan migrate:fresh
```

## 📝 Code Style

This project follows PSR-12 coding standards, enforced by Laravel Pint:

```bash
./vendor/bin/pint
```

## 🤝 Contributing

1. Follow PSR-12 coding standards
2. Write tests for new features
3. Update documentation
4. Run tests before committing
5. Format code with Pint

---

**Part of the E-Commerce Platform**
- [Main README](../README.md)
- [Frontend README](../frontend/README.md)
