# Authentication System Overview

## System Architecture

The authentication system is built using Laravel Sanctum for token-based authentication. All components are organized following Laravel best practices.

## File Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── AuthController.php          # Main authentication controller
│   │   ├── Requests/
│   │   │   └── Auth/
│   │   │       ├── RegisterRequest.php         # Registration validation
│   │   │       ├── LoginRequest.php            # Login validation
│   │   │       ├── UpdateProfileRequest.php   # Profile update validation
│   │   │       └── ChangePasswordRequest.php  # Password change validation
│   │   └── Resources/
│   │       └── UserResource.php               # User data formatting for API
│   ├── Models/
│   │   └── User.php                           # User model with HasApiTokens
│   ├── routes/
│   │   └── api.php                            # API routes (versioned)
│   ├── config/
│   │   ├── auth.php                           # Authentication configuration
│   │   └── sanctum.php                        # Sanctum configuration
│   └── database/
│       └── migrations/
│           └── 2025_10_29_113827_create_personal_access_tokens_table.php
```

## Components

### 1. Authentication Controller (`app/Http/Controllers/Api/AuthController.php`)

Handles all authentication logic:
- **register()** - Creates new user account and returns token
- **login()** - Authenticates user and returns token
- **logout()** - Revokes current token
- **me()** - Returns authenticated user profile
- **updateProfile()** - Updates user profile information
- **changePassword()** - Changes user password

### 2. Form Request Validators (`app/Http/Requests/Auth/`)

Validates incoming requests:
- **RegisterRequest** - Validates registration data (email, password, names, phone)
- **LoginRequest** - Validates login credentials (email, password)
- **UpdateProfileRequest** - Validates profile update data
- **ChangePasswordRequest** - Validates password change data

### 3. API Resource (`app/Http/Resources/UserResource.php`)

Formats user data for API responses:
- Hides sensitive information (password_hash)
- Provides consistent response structure
- Includes computed fields (full_name)

### 4. User Model (`app/Models/User.php`)

Updated with:
- `HasApiTokens` trait from Laravel Sanctum
- `getFullNameAttribute()` accessor
- Proper password handling with `password_hash` field
- `getAuthPassword()` method for authentication

### 5. API Routes (`routes/api.php`)

Versioned API routes:
- Public routes: `/api/v1/auth/register`, `/api/v1/auth/login`
- Protected routes: `/api/v1/auth/logout`, `/api/v1/auth/me`, `/api/v1/auth/profile`, `/api/v1/auth/password`
- Rate limiting applied to public routes (5 requests/minute)

### 6. Configuration Files

**auth.php:**
- Added `sanctum` guard
- Configured for token-based authentication

**sanctum.php:**
- Stateful domains configuration
- Token expiration settings
- Middleware configuration

**bootstrap/app.php:**
- Registered API routes

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt
2. **Token Management**: Secure token generation and revocation
3. **Rate Limiting**: Prevents brute force attacks on auth endpoints
4. **Validation**: Comprehensive input validation on all endpoints
5. **Active Account Check**: Only active accounts can authenticate
6. **Token Revocation**: Tokens revoked on logout and password change

## API Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/v1/auth/register` | No | Register new user |
| POST | `/api/v1/auth/login` | No | Login user |
| POST | `/api/v1/auth/logout` | Yes | Logout user |
| GET | `/api/v1/auth/me` | Yes | Get current user |
| PUT | `/api/v1/auth/profile` | Yes | Update profile |
| PUT | `/api/v1/auth/password` | Yes | Change password |

## Response Format

All endpoints follow a consistent response structure:

**Success Response:**
```json
{
  "message": "Success message",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "message": "Error message",
  "errors": { ... }
}
```

## Usage Flow

1. **Registration/Login**:
   - User provides credentials
   - API validates and creates/authenticates user
   - Returns user data and token

2. **Authenticated Requests**:
   - Client includes `Authorization: Bearer {token}` header
   - API validates token and processes request
   - Returns requested data

3. **Logout**:
   - Client sends logout request with token
   - API revokes token
   - Client should remove token from storage

## Frontend Integration

### Storage
- Store token after login/register (e.g., localStorage, httpOnly cookie)
- Include token in Authorization header for protected endpoints
- Remove token on logout or 401 errors

### Error Handling
- Handle 401 (Unauthenticated) by clearing token and redirecting to login
- Handle 422 (Validation errors) by displaying field-specific errors
- Handle 429 (Rate limit) by showing appropriate message

## Testing

To test the authentication system:

1. **Run migrations:**
   ```bash
   php artisan migrate
   ```

2. **Test registration:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","password_confirmation":"password123"}'
   ```

3. **Test login:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

4. **Test protected endpoint:**
   ```bash
   curl -X GET http://localhost:8000/api/v1/auth/me \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json"
   ```

## Next Steps

After authentication is complete, you can:
1. Add password reset functionality
2. Add email verification
3. Add two-factor authentication
4. Add social authentication (OAuth)
5. Implement refresh tokens

## Documentation

- **API Documentation**: [AUTHENTICATION_API.md](AUTHENTICATION_API.md)
- **General API Docs**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---

**Last Updated:** October 29, 2025  
**Status:** Production Ready

