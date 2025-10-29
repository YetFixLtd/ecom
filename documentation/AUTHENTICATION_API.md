# Authentication API Documentation

## Overview

The authentication API provides endpoints for user registration, login, logout, and profile management. All authentication is handled using Laravel Sanctum for token-based authentication.

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication Method

This API uses Laravel Sanctum for token-based authentication. Include the bearer token in the Authorization header for protected endpoints:

```
Authorization: Bearer {token}
```

The token is returned when registering or logging in, and must be included in all subsequent authenticated requests.

---

## Public Endpoints

### Register User

Create a new user account and receive an authentication token.

**Endpoint:** `POST /api/v1/auth/register`

**Rate Limit:** 5 requests per minute

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "password_confirmation": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

**Fields:**
- `email` (required, string, email, max:191, unique): User's email address
- `password` (required, string, min:8, confirmed): User's password
- `password_confirmation` (required, string): Password confirmation (must match password)
- `first_name` (optional, string, max:100): User's first name
- `last_name` (optional, string, max:100): User's last name
- `phone` (optional, string, max:50): User's phone number

**Response (201 Created):**
```json
{
  "message": "User registered successfully.",
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "phone": "+1234567890",
      "is_active": true,
      "email_verified_at": null,
      "created_at": "2025-10-29T12:00:00.000000Z",
      "updated_at": "2025-10-29T12:00:00.000000Z"
    },
    "token": "1|abcdefghijklmnopqrstuvwxyz1234567890"
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
      "The email field is required.",
      "This email address is already registered."
    ],
    "password": [
      "The password field is required.",
      "Password confirmation does not match.",
      "The password must be at least 8 characters."
    ]
  }
}
```

**429 Too Many Requests:**
```json
{
  "message": "Too Many Attempts."
}
```

---

### Login

Authenticate an existing user and receive an authentication token.

**Endpoint:** `POST /api/v1/auth/login`

**Rate Limit:** 5 requests per minute

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Fields:**
- `email` (required, string, email): User's email address
- `password` (required, string): User's password

**Response (200 OK):**
```json
{
  "message": "Login successful.",
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "phone": "+1234567890",
      "is_active": true,
      "email_verified_at": "2025-10-29T12:30:00.000000Z",
      "created_at": "2025-10-29T12:00:00.000000Z",
      "updated_at": "2025-10-29T12:30:00.000000Z"
    },
    "token": "2|abcdefghijklmnopqrstuvwxyz1234567890"
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
      "Your account has been deactivated. Please contact support."
    ]
  }
}
```

**Note:** All existing tokens are revoked on login for security purposes.

---

## Protected Endpoints

All protected endpoints require authentication via Bearer token in the Authorization header.

### Logout

Revoke the current authentication token.

**Endpoint:** `POST /api/v1/auth/logout`

**Authentication:** Required

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

**Error Responses:**

**401 Unauthorized:**
```json
{
  "message": "Unauthenticated."
}
```

---

### Get Current User Profile

Retrieve the authenticated user's profile information.

**Endpoint:** `GET /api/v1/auth/me`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "is_active": true,
    "email_verified_at": "2025-10-29T12:30:00.000000Z",
    "created_at": "2025-10-29T12:00:00.000000Z",
    "updated_at": "2025-10-29T12:30:00.000000Z"
  }
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "message": "Unauthenticated."
}
```

---

### Update Profile

Update the authenticated user's profile information.

**Endpoint:** `PUT /api/v1/auth/profile`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
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
    "email": "newemail@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "full_name": "Jane Smith",
    "phone": "+9876543210",
    "is_active": true,
    "email_verified_at": null,
    "created_at": "2025-10-29T12:00:00.000000Z",
    "updated_at": "2025-10-29T13:00:00.000000Z"
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
      "This email address is already taken."
    ]
  }
}
```

**401 Unauthorized:**
```json
{
  "message": "Unauthenticated."
}
```

---

### Change Password

Change the authenticated user's password.

**Endpoint:** `PUT /api/v1/auth/password`

**Authentication:** Required

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

**Important:** All tokens are revoked after password change. The user must login again to receive a new token.

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

**422 Validation Error (Validation):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "password": [
      "Password confirmation does not match.",
      "The password must be at least 8 characters."
    ]
  }
}
```

**401 Unauthorized:**
```json
{
  "message": "Unauthenticated."
}
```

---

## Error Responses

### Common Error Responses

#### 400 Bad Request
```json
{
  "message": "Bad request."
}
```

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
  "message": "This action is unauthorized."
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

#### 500 Server Error
```json
{
  "message": "Server Error"
}
```
In development mode, additional error details may be included.

---

## Frontend Integration

### Storing the Token

After successful login or registration, store the token securely:

```javascript
// Example: Using localStorage (Note: Consider httpOnly cookies for production)
const response = await fetch('http://localhost:8000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
localStorage.setItem('auth_token', data.data.token);
```

### Using the Token

Include the token in all authenticated requests:

```javascript
const token = localStorage.getItem('auth_token');

const response = await fetch('http://localhost:8000/api/v1/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});
```

### Handling Token Expiration

If you receive a 401 Unauthorized response, clear the stored token and redirect to login:

```javascript
if (response.status === 401) {
  localStorage.removeItem('auth_token');
  // Redirect to login page
  window.location.href = '/login';
}
```

### Logout

When logging out, also clear the token from storage:

```javascript
const token = localStorage.getItem('auth_token');

await fetch('http://localhost:8000/api/v1/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

localStorage.removeItem('auth_token');
// Redirect to login page
```

---

## Security Features

1. **Token-Based Authentication:** Uses Laravel Sanctum for secure token management
2. **Password Hashing:** Passwords are hashed using bcrypt before storage
3. **Rate Limiting:** Login and registration endpoints are rate-limited to prevent brute force attacks
4. **Token Revocation:** 
   - All tokens are revoked on login (only one active session per user)
   - All tokens are revoked on password change (requires re-login)
5. **Active Account Check:** Inactive accounts cannot login
6. **Validation:** All inputs are validated before processing

---

## Rate Limiting

- **Registration/Login:** 5 requests per minute per IP address
- **Other Endpoints:** Follow default API rate limiting (60 requests per minute for authenticated users)

---

## Notes

- Tokens do not expire by default (can be configured in `config/sanctum.php`)
- Only one token per user is active at a time (tokens are revoked on login)
- Password change requires re-authentication
- Email addresses must be unique across the system
- Passwords must be at least 8 characters (Laravel default password rules)

---

**Last Updated:** October 29, 2025  
**API Version:** v1  
**Status:** Active

