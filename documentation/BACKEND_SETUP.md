# Backend Setup Guide (Laravel)

## Prerequisites
- PHP 8.2 or higher
- Composer
- SQLite/MySQL/PostgreSQL
- Git

## Installation Steps

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
Dependencies are already installed during project initialization. If needed:
```bash
composer install
```

### 3. Environment Configuration
A `.env` file has been automatically created. Key configurations:

```env
APP_NAME=Ecommerce
APP_ENV=local
APP_KEY=[auto-generated]
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
# DB_DATABASE=/absolute/path/to/database.sqlite

FRONTEND_URL=http://localhost:3000
```

### 4. Database Setup
The SQLite database has been created automatically at:
```
database/database.sqlite
```

Migrations have been run automatically. To reset or re-run:
```bash
php artisan migrate:fresh
```

### 5. Generate Application Key
Already done during setup. If needed:
```bash
php artisan key:generate
```

## Running the Development Server

### Start Laravel Server
```bash
php artisan serve
```
Server will run at: `http://localhost:8000`

### Alternative: Use Sail (Docker)
```bash
./vendor/bin/sail up
```

## Available Artisan Commands

### Development
```bash
# Run development server
php artisan serve

# View routes
php artisan route:list

# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# Run tinker (REPL)
php artisan tinker
```

### Database
```bash
# Run migrations
php artisan migrate

# Fresh migration (drop all tables)
php artisan migrate:fresh

# Seed database
php artisan db:seed

# Fresh migration with seeding
php artisan migrate:fresh --seed
```

### Code Quality
```bash
# Format code (Laravel Pint)
./vendor/bin/pint

# Run tests
php artisan test
```

## API Development

### Creating API Routes
Edit `routes/api.php`:
```php
Route::prefix('v1')->group(function () {
    // Public routes
    Route::get('/products', [ProductController::class, 'index']);
    
    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/orders', [OrderController::class, 'store']);
    });
});
```

### Creating Controllers
```bash
php artisan make:controller Api/ProductController --api
```

### Creating Models
```bash
php artisan make:model Product -mfc
# -m: migration, -f: factory, -c: controller
```

## CORS Configuration

### Install and Configure CORS
CORS is included by default. Configure in `config/cors.php`:

```php
'paths' => ['api/*'],
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```

## Authentication Setup (Laravel Sanctum)

### Install Sanctum
```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

### Configure Sanctum
Add to `config/sanctum.php`:
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:3000')),
```

## Testing

### Run Tests
```bash
# Run all tests
php artisan test

# Run specific test
php artisan test --filter=ProductTest

# Run with coverage
php artisan test --coverage
```

### Create Tests
```bash
php artisan make:test ProductTest
php artisan make:test ProductTest --unit
```

## Useful Packages for E-commerce

### Recommended Packages
```bash
# Image handling
composer require intervention/image

# API resources
composer require spatie/laravel-query-builder

# Payment processing
composer require stripe/stripe-php
# or
composer require omnipay/omnipay

# Admin panel (optional)
composer require laravel/nova
# or
composer require filament/filament
```

## Project Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/          # API controllers
│   │   ├── Middleware/
│   │   └── Requests/          # Form requests
│   ├── Models/                # Eloquent models
│   ├── Services/              # Business logic
│   └── Repositories/          # Data access layer
├── config/                    # Configuration files
├── database/
│   ├── migrations/            # Database migrations
│   ├── seeders/               # Database seeders
│   └── factories/             # Model factories
├── routes/
│   ├── api.php               # API routes
│   └── web.php               # Web routes
├── storage/                   # File storage
├── tests/                     # Tests
└── .env                       # Environment variables
```

## Environment Variables

### Essential Variables
```env
# Application
APP_NAME=Ecommerce
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=sqlite

# Frontend
FRONTEND_URL=http://localhost:3000

# Mail (for development)
MAIL_MAILER=log

# Cache
CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=database
```

## Troubleshooting

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
# Reset database
php artisan migrate:fresh

# Check database connection
php artisan tinker
> DB::connection()->getPdo();
```

## Best Practices

1. **Use API Resources** for consistent JSON responses
2. **Form Requests** for validation
3. **Service Classes** for business logic
4. **Repository Pattern** for data access (optional but recommended)
5. **Use Eloquent relationships** properly
6. **Write tests** for critical functionality
7. **Use migrations** for database changes
8. **Never commit** `.env` file
9. **Use Laravel Pint** for code formatting
10. **Document API endpoints** in API_DOCUMENTATION.md

---

**Last Updated**: October 27, 2025

