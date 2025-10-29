# Administrators Setup

## Overview

The e-commerce system now includes a separate `administrators` table to manage staff, workers, and admin accounts separately from customer accounts.

## Database Structure

### Tables: 32 Total

**User Management:**
- `users` - Customer accounts (customers only)
- `administrators` - Staff/admin accounts (NEW!)
- `addresses` - User addresses

**All other tables remain unchanged (30 tables)**

---

## Administrator Model

**Location:** `app/Models/Administrator.php`

### Features
- ✅ Separate from customers (User model)
- ✅ Role-based access control (super_admin, admin, manager, staff, worker)
- ✅ Soft deletes support
- ✅ Last login tracking
- ✅ Active/inactive status
- ✅ Helper methods for role checking

### Roles Hierarchy

```
super_admin   → Full system access
admin          → Administrative access  
manager        → Management access
staff          → Standard staff access
worker         → Limited worker access
```

### Usage Examples

```php
use App\Models\Administrator;

// Create an admin
$admin = Administrator::create([
    'email' => 'admin@example.com',
    'password_hash' => bcrypt('password'),
    'first_name' => 'John',
    'last_name' => 'Doe',
    'role' => 'admin',
    'is_active' => true,
]);

// Check roles
$admin->isSuperAdmin();  // false
$admin->isAdmin();       // true
$admin->isManager();     // false
$admin->isWorker();      // false

// Get full name
echo $admin->full_name;  // "John Doe"

// Query active administrators
$admins = Administrator::active()->get();

// Query by role
$managers = Administrator::role('manager')->get();
```

---

## Field Definitions

### administrators Table

| Field | Type | Description |
|-------|------|-------------|
| id | bigint | Primary key |
| email | string(191) | Unique email address |
| password_hash | string(255) | Hashed password |
| first_name | string(100) | First name |
| last_name | string(100) | Last name |
| phone | string(50) | Phone number (nullable) |
| role | string(50) | Role: super_admin, admin, manager, staff, worker |
| is_active | boolean | Active status |
| email_verified_at | timestamp | Email verification |
| last_login_at | timestamp | Last login time |
| remember_token | string | Remember me token |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Update time |
| deleted_at | timestamp | Soft delete |

---

## Authentication Setup

### Separate Guards (Recommended)

Update `config/auth.php`:

```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
    
    'admin' => [
        'driver' => 'session',
        'provider' => 'administrators',
    ],
],

'providers' => [
    'users' => [
        'driver' => 'eloquent',
        'model' => App\Models\User::class,
    ],
    
    'administrators' => [
        'driver' => 'eloquent',
        'model' => App\Models\Administrator::class,
    ],
],
```

### Usage

**Customer Login:**
```php
Auth::guard('web')->attempt([
    'email' => $email,
    'password' => $password
]);
```

**Admin Login:**
```php
Auth::guard('admin')->attempt([
    'email' => $email,
    'password_hash' => $password  // Note: uses password_hash
]);
```

---

## User vs Administrator

### Separation of Concerns

| Model | Purpose | Used For |
|-------|---------|----------|
| **User** | Customer accounts | Shopping, orders, cart |
| **Administrator** | Staff accounts | Dashboard, management, operations |

### Key Differences

**User (Customers):**
- Focus on shopping experience
- Has addresses, carts, orders
- Password stored in `password_hash` field
- Customer-facing features

**Administrator (Staff):**
- Focus on system management
- Has roles and permissions
- Password stored in `password_hash` field
- Admin-facing features

---

## Migration Info

**File:** `2025_10_27_125438_create_administrators_table.php`

**Run with:**
```bash
php artisan migrate
```

**Rollback:**
```bash
php artisan migrate:rollback
```

---

## Next Steps

1. **Create Admin Factory** (for testing)
2. **Create Admin Seeder** (initial admin account)
3. **Setup Guards** (update auth.php)
4. **Create Auth Controllers** (login, logout)
5. **Create Middleware** (admin-only routes)
6. **Assign Permissions** (role-based access)

---

## Example Seeder

```php
// database/seeders/AdministratorSeeder.php

use App\Models\Administrator;

Administrator::create([
    'email' => 'admin@ecommerce.com',
    'password_hash' => bcrypt('Admin@123!'),
    'first_name' => 'Super',
    'last_name' => 'Admin',
    'role' => 'super_admin',
    'is_active' => true,
    'email_verified_at' => now(),
]);
```

---

## Summary

✅ **Administrators table created**  
✅ **Administrator model created**  
✅ **User model updated** (clarified as customers)  
✅ **Migration tested and working**  
✅ **32 total tables** (31 previous + 1 new)  
✅ **27 models + 1 new = 28 models**  

The system now has clear separation between:
- **Customers** → User model (shopping, orders)
- **Staff/Admins** → Administrator model (management, operations)

