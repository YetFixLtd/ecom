# Admin Authentication API Documentation

## Overview

The Admin Authentication API provides endpoints for administrator authentication, profile management, and admin CRUD operations. This system is completely separate from the customer/user authentication system.

**Important:** 
- Administrators and Users (customers) are different entities with separate authentication systems, routes, and guards.
- **There is NO registration/signup endpoint for administrators.** Admin accounts can only be created by:
  1. Running the `AdministratorSeeder` (initial super_admin setup)
  2. Using the admin management API (super_admin can create other admins)

## Base URL
```
http://localhost:8000/api/v1/admin
```

## Initial Setup

Before using the admin API, you must create the initial super admin account by running the database seeder:

```bash
php artisan db:seed --class=AdministratorSeeder
```

This creates a default super admin with:
- **Email:** `admin@ecommerce.com`
- **Password:** `Admin@123!`
- **Role:** `super_admin`

**⚠️ SECURITY WARNING:** Change this password immediately after first login!

After the initial super admin is created, they can create additional administrators through the API endpoints described below. Regular users (customers) cannot create admin accounts, and there is no public registration endpoint for administrators.

## Authentication Method

This API uses Laravel Sanctum for token-based authentication with the `admin_sanctum` guard. Include the bearer token in the Authorization header for protected endpoints:

```
Authorization: Bearer {token}
```

The token is returned when logging in and must be included in all subsequent authenticated requests.

---

## Role Hierarchy

The system supports five administrator roles with hierarchical permissions:

| Role | Level | Description |
|------|-------|-------------|
| **super_admin** | 5 (Highest) | Full system access, can manage other administrators |
| **admin** | 4 | Administrative access |
| **manager** | 3 | Management access |
| **staff** | 2 | Standard staff access |
| **worker** | 1 (Lowest) | Limited worker access |

**Note:** `super_admin` has unrestricted access to all routes and operations.

---

## Important Notes

**❌ NO REGISTRATION ENDPOINT:** Unlike customer/user authentication, administrators cannot self-register. Admin accounts are created through:
1. **Initial Setup:** Running `AdministratorSeeder` to create the first super_admin
2. **Super Admin Management:** Existing super_admin can create additional administrators via the management API

This ensures proper security and access control.

---

## Public Endpoints

### Admin Login

Authenticate an administrator and receive an authentication token.

**Endpoint:** `POST /api/v1/admin/auth/login`

**Rate Limit:** 5 requests per minute

**Request Body:**
```json
{
  "email": "admin@ecommerce.com",
  "password": "Admin@123!"
}
```

**Fields:**
- `email` (required, string, email): Administrator's email address
- `password` (required, string): Administrator's password

**Response (200 OK):**
```json
{
  "message": "Login successful.",
  "data": {
    "administrator": {
      "id": 1,
      "email": "admin@ecommerce.com",
      "first_name": "Super",
      "last_name": "Admin",
      "full_name": "Super Admin",
      "phone": "+1234567890",
      "role": "super_admin",
      "is_active": true,
      "email_verified_at": "2025-10-29T12:00:00+00:00",
      "last_login_at": "2025-10-29T14:30:00+00:00",
      "created_at": "2025-10-29T12:00:00+00:00",
      "updated_at": "2025-10-29T14:30:00+00:00"
    },
    "token": "1|abcdefghijklmnopqrstuvwxyz1234567890"
  }
}
```

**Error Responses:**

**422 Validation Error (Invalid Credentials):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": [
      "The provided credentials are incorrect."
    ]
  }
}
```

**422 Validation Error (Inactive Account):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": [
      "Your administrator account has been deactivated. Please contact the system administrator."
    ]
  }
}
```

**Note:** All existing tokens are revoked on login (only one active session per administrator).

---

## Protected Endpoints (All Roles)

All administrators (regardless of role) can access these endpoints.

### Logout

Revoke the current authentication token.

**Endpoint:** `POST /api/v1/admin/auth/logout`

**Authentication:** Required (any admin role)

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:** None

**Response (200 OK):**
```json
{
  "message": "Logged out successfully."
}
```

---

### Get Current Administrator Profile

Retrieve the authenticated administrator's profile information.

**Endpoint:** `GET /api/v1/admin/auth/me`

**Authentication:** Required (any admin role)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "email": "admin@ecommerce.com",
    "first_name": "Super",
    "last_name": "Admin",
    "full_name": "Super Admin",
    "phone": "+1234567890",
    "role": "super_admin",
    "is_active": true,
    "email_verified_at": "2025-10-29T12:00:00+00:00",
    "last_login_at": "2025-10-29T14:30:00+00:00",
    "created_at": "2025-10-29T12:00:00+00:00",
    "updated_at": "2025-10-29T14:30:00+00:00"
  }
}
```

---

### Update Profile

Update the authenticated administrator's profile information.

**Endpoint:** `PUT /api/v1/admin/auth/profile`

**Authentication:** Required (any admin role)

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newemail@ecommerce.com",
  "first_name": "Jane",
  "last_name": "Manager",
  "phone": "+9876543210"
}
```

**Fields:** (All fields are optional - only provided fields will be updated)
- `email` (optional, string, email, max:191, unique): New email address
- `first_name` (optional, string, max:100): New first name
- `last_name` (optional, string, max:100): New last name
- `phone` (optional, string, max:50): New phone number

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully.",
  "data": {
    "id": 1,
    "email": "newemail@ecommerce.com",
    "first_name": "Jane",
    "last_name": "Manager",
    "full_name": "Jane Manager",
    "phone": "+9876543210",
    "role": "super_admin",
    "is_active": true,
    "email_verified_at": "2025-10-29T12:00:00+00:00",
    "last_login_at": "2025-10-29T14:30:00+00:00",
    "created_at": "2025-10-29T12:00:00+00:00",
    "updated_at": "2025-10-29T15:00:00+00:00"
  }
}
```

**Error Responses:**

**422 Validation Error:**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": [
      "This email address is already in use by another administrator."
    ]
  }
}
```

---

### Change Password

Change the authenticated administrator's password.

**Endpoint:** `PUT /api/v1/admin/auth/password`

**Authentication:** Required (any admin role)

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "current_password": "OldPassword123!",
  "password": "NewSecurePassword123!",
  "password_confirmation": "NewSecurePassword123!"
}
```

**Fields:**
- `current_password` (required, string): Current password for verification
- `password` (required, string, min:8, confirmed): New password
- `password_confirmation` (required, string): New password confirmation

**Response (200 OK):**
```json
{
  "message": "Password changed successfully. Please login again."
}
```

**Important:** All tokens are revoked after password change. The administrator must login again to receive a new token.

**Error Responses:**

**422 Validation Error (Wrong Current Password):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "current_password": [
      "The current password is incorrect."
    ]
  }
}
```

---

## Protected Endpoints (Super Admin Only)

These endpoints are only accessible by administrators with the `super_admin` role.

### List All Administrators

Get a paginated list of all administrators with optional filtering.

**Endpoint:** `GET /api/v1/admin/administrators`

**Authentication:** Required (super_admin only)

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `role` (optional, string): Filter by role (super_admin, admin, manager, staff, worker)
- `is_active` (optional, boolean): Filter by active status (1 or 0)
- `search` (optional, string): Search by first_name, last_name, or email
- `per_page` (optional, integer, default: 15): Number of results per page

**Example:** `GET /api/v1/admin/administrators?role=manager&is_active=1&search=John&per_page=10`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 2,
      "email": "manager@ecommerce.com",
      "first_name": "John",
      "last_name": "Manager",
      "full_name": "John Manager",
      "phone": "+1234567890",
      "role": "manager",
      "is_active": true,
      "email_verified_at": "2025-10-29T12:00:00+00:00",
      "last_login_at": "2025-10-29T13:00:00+00:00",
      "created_at": "2025-10-29T12:00:00+00:00",
      "updated_at": "2025-10-29T13:00:00+00:00"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 15,
    "total": 42
  }
}
```

---

### Create Administrator

Create a new administrator account.

**Endpoint:** `POST /api/v1/admin/administrators`

**Authentication:** Required (super_admin only)

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newadmin@ecommerce.com",
  "password": "SecurePassword123!",
  "password_confirmation": "SecurePassword123!",
  "first_name": "New",
  "last_name": "Admin",
  "phone": "+1234567890",
  "role": "manager",
  "is_active": true
}
```

**Fields:**
- `email` (required, string, email, unique): Email address
- `password` (required, string, min:8, confirmed): Password
- `password_confirmation` (required, string): Password confirmation
- `first_name` (required, string, max:100): First name
- `last_name` (required, string, max:100): Last name
- `phone` (optional, string, max:50): Phone number
- `role` (required, string): Role (super_admin, admin, manager, staff, worker)
- `is_active` (optional, boolean, default: true): Active status

**Response (201 Created):**
```json
{
  "message": "Administrator created successfully.",
  "data": {
    "id": 5,
    "email": "newadmin@ecommerce.com",
    "first_name": "New",
    "last_name": "Admin",
    "full_name": "New Admin",
    "phone": "+1234567890",
    "role": "manager",
    "is_active": true,
    "email_verified_at": "2025-10-29T15:00:00+00:00",
    "last_login_at": null,
    "created_at": "2025-10-29T15:00:00+00:00",
    "updated_at": "2025-10-29T15:00:00+00:00"
  }
}
```

---

### View Administrator Details

Get details of a specific administrator.

**Endpoint:** `GET /api/v1/admin/administrators/{id}`

**Authentication:** Required (super_admin only)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 2,
    "email": "admin@ecommerce.com",
    "first_name": "John",
    "last_name": "Admin",
    "full_name": "John Admin",
    "phone": "+1234567890",
    "role": "admin",
    "is_active": true,
    "email_verified_at": "2025-10-29T12:00:00+00:00",
    "last_login_at": "2025-10-29T14:00:00+00:00",
    "created_at": "2025-10-29T12:00:00+00:00",
    "updated_at": "2025-10-29T14:00:00+00:00"
  }
}
```

---

### Update Administrator

Update an administrator's information.

**Endpoint:** `PUT /api/v1/admin/administrators/{id}`

**Authentication:** Required (super_admin only)

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:** (All fields are optional - only provided fields will be updated)
```json
{
  "email": "updated@ecommerce.com",
  "password": "NewPassword123!",
  "password_confirmation": "NewPassword123!",
  "first_name": "Updated",
  "last_name": "Name",
  "phone": "+9876543210",
  "role": "admin",
  "is_active": false
}
```

**Fields:**
- `email` (optional, string, email, unique): Email address
- `password` (optional, string, min:8, confirmed): New password
- `password_confirmation` (required if password is provided): Password confirmation
- `first_name` (optional, string, max:100): First name
- `last_name` (optional, string, max:100): Last name
- `phone` (optional, string, max:50): Phone number
- `role` (optional, string): Role
- `is_active` (optional, boolean): Active status

**Response (200 OK):**
```json
{
  "message": "Administrator updated successfully.",
  "data": {
    "id": 2,
    "email": "updated@ecommerce.com",
    "first_name": "Updated",
    "last_name": "Name",
    "full_name": "Updated Name",
    "phone": "+9876543210",
    "role": "admin",
    "is_active": false,
    "email_verified_at": "2025-10-29T12:00:00+00:00",
    "last_login_at": "2025-10-29T14:00:00+00:00",
    "created_at": "2025-10-29T12:00:00+00:00",
    "updated_at": "2025-10-29T16:00:00+00:00"
  }
}
```

**Restrictions:**
- Super admins cannot change their own role (returns 403)

---

### Delete Administrator

Soft delete an administrator account.

**Endpoint:** `DELETE /api/v1/admin/administrators/{id}`

**Authentication:** Required (super_admin only)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "message": "Administrator deleted successfully."
}
```

**Restrictions:**
- Super admins cannot delete their own account (returns 403)

---

### Activate Administrator

Activate an inactive administrator account.

**Endpoint:** `POST /api/v1/admin/administrators/{id}/activate`

**Authentication:** Required (super_admin only)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "message": "Administrator activated successfully.",
  "data": {
    "id": 2,
    "email": "admin@ecommerce.com",
    "first_name": "John",
    "last_name": "Admin",
    "full_name": "John Admin",
    "phone": "+1234567890",
    "role": "admin",
    "is_active": true,
    "email_verified_at": "2025-10-29T12:00:00+00:00",
    "last_login_at": "2025-10-29T14:00:00+00:00",
    "created_at": "2025-10-29T12:00:00+00:00",
    "updated_at": "2025-10-29T16:00:00+00:00"
  }
}
```

---

### Deactivate Administrator

Deactivate an administrator account.

**Endpoint:** `POST /api/v1/admin/administrators/{id}/deactivate`

**Authentication:** Required (super_admin only)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "message": "Administrator deactivated successfully.",
  "data": {
    "id": 2,
    "email": "admin@ecommerce.com",
    "first_name": "John",
    "last_name": "Admin",
    "full_name": "John Admin",
    "phone": "+1234567890",
    "role": "admin",
    "is_active": false,
    "email_verified_at": "2025-10-29T12:00:00+00:00",
    "last_login_at": "2025-10-29T14:00:00+00:00",
    "created_at": "2025-10-29T12:00:00+00:00",
    "updated_at": "2025-10-29T16:00:00+00:00"
  }
}
```

**Note:** Deactivating an administrator automatically revokes all their tokens.

**Restrictions:**
- Super admins cannot deactivate their own account (returns 403)

---

## Error Responses

### Common Error Responses

#### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```
Occurs when:
- Token is missing
- Token is invalid or expired
- Token has been revoked

#### 403 Forbidden
```json
{
  "message": "This action is unauthorized. Required role: super_admin"
}
```
Occurs when:
- Admin doesn't have the required role
- Admin is inactive
- Admin tries to perform restricted operations on their own account

#### 404 Not Found
```json
{
  "message": "No query results for model [App\\Models\\Administrator] {id}"
}
```

#### 422 Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field_name": [
      "Error message 1",
      "Error message 2"
    ]
  }
}
```

#### 429 Too Many Requests
```json
{
  "message": "Too Many Attempts."
}
```
Occurs when rate limit is exceeded.

---

## Security Features

1. **Separate Guard:** Admin authentication uses `admin_sanctum` guard, completely separate from user authentication
2. **Token-Based Authentication:** Uses Laravel Sanctum for secure token management
3. **Password Hashing:** Passwords are hashed using bcrypt before storage
4. **Rate Limiting:** Login endpoints are rate-limited (5 requests/minute) to prevent brute force attacks
5. **Token Revocation:**
   - All tokens are revoked on login (one active session per admin)
   - All tokens are revoked on password change
   - Tokens are revoked when admin is deactivated
6. **Active Status Check:** Inactive administrators cannot access any protected routes
7. **Role-Based Access Control:** Super admin role required for management operations
8. **Soft Deletes:** Administrators are soft deleted for audit trail
9. **Last Login Tracking:** System tracks last login timestamp
10. **Self-Protection:** Admins cannot delete/deactivate themselves or change their own role

---

## Rate Limiting

- **Login:** 5 requests per minute per IP address
- **Other Endpoints:** Follow default API rate limiting (60 requests per minute for authenticated admins)

---

## Frontend Integration Example

### Login and Store Token
```javascript
const response = await fetch('http://localhost:8000/api/v1/admin/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@ecommerce.com',
    password: 'Admin@123!'
  })
});

const data = await response.json();
localStorage.setItem('admin_token', data.data.token);
```

### Use Token in Requests
```javascript
const token = localStorage.getItem('admin_token');

const response = await fetch('http://localhost:8000/api/v1/admin/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});
```

### Handle Unauthorized
```javascript
if (response.status === 401 || response.status === 403) {
  localStorage.removeItem('admin_token');
  window.location.href = '/admin/login';
}
```

---

**Last Updated:** October 29, 2025  
**API Version:** v1  
**Status:** Active

