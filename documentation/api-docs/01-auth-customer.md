# Customer Authentication

## Summary
Customer auth endpoints using sanctum tokens.

## Auth
- Public: register, login (rate limited)
- Protected: logout, me, update profile, change password

## Endpoints
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- GET /api/v1/auth/me
- PUT /api/v1/auth/profile
- PUT /api/v1/auth/password

## Request/Response Examples

### POST /auth/register
Request
```json
{
  "email": "user@example.com",
  "password": "Secret123!",
  "password_confirmation": "Secret123!",
  "first_name": "Ada",
  "last_name": "Lovelace",
  "phone": "+1 555-1111"
}
```
Response 201
```json
{
  "message": "User registered successfully.",
  "data": {
    "user": { "id": 1, "email": "user@example.com", "first_name": "Ada", "last_name": "Lovelace", "phone": "+1 555-1111" },
    "token": "<token>"
  }
}
```

### POST /auth/login
Request
```json
{ "email": "user@example.com", "password": "Secret123!" }
```
Response 200
```json
{
  "message": "Login successful.",
  "data": { "user": { "id": 1, "email": "user@example.com" }, "token": "<token>" }
}
```

### GET /auth/me
Response 200
```json
{ "data": { "id": 1, "email": "user@example.com", "first_name": "Ada", "last_name": "Lovelace", "phone": "+1 555-1111" } }
```

### PUT /auth/profile
Request (any subset)
```json
{ "email": "new@example.com", "first_name": "Ada", "last_name": "L.", "phone": "+1 555-2222" }
```
Response 200
```json
{ "message": "Profile updated successfully.", "data": { "id": 1, "email": "new@example.com" } }
```

### PUT /auth/password
Request
```json
{ "current_password": "Secret123!", "password": "NewSecret123!", "password_confirmation": "NewSecret123!" }
```
Response 200
```json
{ "message": "Password changed successfully. Please login again." }
```

### Errors
422 Validation
```json
{ "message": "The given data was invalid.", "errors": { "email": ["The email has already been taken."] } }
```
401 Unauthorized
```json
{ "message": "Unauthenticated." }
```
