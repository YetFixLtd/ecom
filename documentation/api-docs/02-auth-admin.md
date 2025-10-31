# Admin Authentication

## Summary
Admin auth endpoints using admin_sanctum guard.

## Auth
- Public: POST /api/v1/admin/auth/login (rate limited)
- Protected: logout, me, profile, password (with `admin.active`), some routes require `admin.role`

## Endpoints
- POST /api/v1/admin/auth/login
- POST /api/v1/admin/auth/logout
- GET /api/v1/admin/auth/me
- PUT /api/v1/admin/auth/profile
- PUT /api/v1/admin/auth/password

## Request/Response Examples

### POST /admin/auth/login
Request
```json
{ "email": "admin@example.com", "password": "Secret123!" }
```
Response 200
```json
{
  "message": "Login successful.",
  "data": { "administrator": { "id": 1, "email": "admin@example.com" }, "token": "<admin_token>" }
}
```

### GET /admin/auth/me
Response 200
```json
{ "data": { "id": 1, "email": "admin@example.com", "first_name": "Ada", "last_name": "Admin" } }
```

### PUT /admin/auth/profile
Request (any subset)
```json
{ "email": "new-admin@example.com", "first_name": "Ada", "last_name": "Admin", "phone": "+1 555-2222" }
```
Response 200
```json
{ "message": "Profile updated successfully.", "data": { "id": 1, "email": "new-admin@example.com" } }
```

### PUT /admin/auth/password
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
{ "message": "The given data was invalid.", "errors": { "email": ["The email must be a valid email address."] } }
```
401 Unauthorized
```json
{ "message": "Unauthenticated." }
```
