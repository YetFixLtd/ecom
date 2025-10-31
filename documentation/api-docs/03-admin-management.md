# Admin Management (Super Admin)

## Summary
Manage administrator accounts. All endpoints require a Super Admin. Actions include listing, filtering, creating, viewing, updating, deleting, and activating/deactivating administrators.

## Auth
- Protected middleware: `auth:admin_sanctum`, `admin.active`, `admin.role:super_admin`
- Provide Bearer token obtained from admin authentication in the `Authorization` header.

## Base Path
- `/api/v1/admin/administrators`

## Endpoints
- `GET /api/v1/admin/administrators`
  - Lists administrators with pagination.
  - Query params:
    - `role` (optional): filter by role (e.g., `super_admin`, `manager`, `staff`).
    - `is_active` (optional): `1` or `0` to filter by active status.
    - `search` (optional): search by first name, last name, or email.
  - Responses:
    - 200 with `data` array of administrators and `meta` pagination.
    - 403 if not super admin.

- `POST /api/v1/admin/administrators`
  - Creates a new administrator.
  - Body fields:
    - `email` (required, unique, email)
    - `password` (required, strong) and `password_confirmation` (required; must match)
    - `first_name` (required)
    - `last_name` (required)
    - `phone` (optional)
    - `role` (required; `super_admin`, `manager`, or `staff`)
    - `is_active` (optional; boolean, defaults to true unless otherwise configured)
  - Responses:
    - 201 with `message` and created admin `data`.
    - 422 with validation errors (`email`, `password`, `role`, `first_name`, `last_name`), including duplicate email.
    - 403 if not super admin.

- `GET /api/v1/admin/administrators/{id}`
  - Retrieves details for a single administrator.
  - Responses:
    - 200 with `data` for the administrator.
    - 403 if not super admin.

- `PUT /api/v1/admin/administrators/{id}`
  - Updates an administrator. Supports changing profile fields (e.g., names, role).
  - Constraints:
    - A super admin cannot change their own `role`. Returns 403 with message.
  - Responses:
    - 200 with `message` and updated `data`.
    - 403 when attempting to change own role.

- `DELETE /api/v1/admin/administrators/{id}`
  - Soft-deletes an administrator.
  - Constraints:
    - A super admin cannot delete their own account. Returns 403 with message.
  - Responses:
    - 200 with `message` on success; record is soft-deleted.
    - 403 when attempting to delete self.

- `POST /api/v1/admin/administrators/{id}/activate`
  - Activates an administrator.
  - Responses:
    - 200 with `message` and `data.is_active = true`.

- `POST /api/v1/admin/administrators/{id}/deactivate`
  - Deactivates an administrator. Deactivation revokes all of the administrator's existing tokens.
  - Constraints:
    - A super admin cannot deactivate their own account. Returns 403 with message.
  - Responses:
    - 200 with `message` and `data.is_active = false`.
    - 403 when attempting to deactivate self.

## Administrator Resource
Fields commonly returned in `data`:
- `id`
- `email`
- `first_name`
- `last_name`
- `role` (`super_admin`, `manager`, `staff`)
- `is_active` (boolean)

## Pagination Meta
Returned on list endpoints:
- `current_page`
- `last_page`
- `per_page`
- `total`

## Examples
```bash
# List administrators (role filter and active only)
curl -sS \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "${API_BASE}/api/v1/admin/administrators?role=manager&is_active=1"

# Search administrators
curl -sS \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "${API_BASE}/api/v1/admin/administrators?search=John"

# Create administrator
curl -sS -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@example.com",
    "password": "SecurePassword123!",
    "password_confirmation": "SecurePassword123!",
    "first_name": "New",
    "last_name": "Admin",
    "phone": "+1234567890",
    "role": "manager",
    "is_active": true
  }' \
  "${API_BASE}/api/v1/admin/administrators"

# View administrator
curl -sS \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "${API_BASE}/api/v1/admin/administrators/123"

# Update administrator
curl -sS -X PUT \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated",
    "role": "manager"
  }' \
  "${API_BASE}/api/v1/admin/administrators/123"

# Delete administrator
curl -sS -X DELETE \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "${API_BASE}/api/v1/admin/administrators/123"

# Activate administrator
curl -sS -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "${API_BASE}/api/v1/admin/administrators/123/activate"

# Deactivate administrator
curl -sS -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "${API_BASE}/api/v1/admin/administrators/123/deactivate"
```

## Response Shapes

- List (200):
```json
{
  "data": [
    {
      "id": 1,
      "email": "admin@example.com",
      "first_name": "First",
      "last_name": "Last",
      "role": "manager",
      "is_active": true
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 6
  }
}
```

- Create (201):
```json
{
  "message": "Administrator created successfully.",
  "data": {
    "id": 7,
    "email": "newadmin@example.com",
    "first_name": "New",
    "last_name": "Admin",
    "role": "manager",
    "is_active": true
  }
}
```

- Update (200):
```json
{
  "message": "Administrator updated successfully.",
  "data": {
    "id": 123,
    "first_name": "Updated",
    "role": "manager"
  }
}
```

- Delete (200):
```json
{
  "message": "Administrator deleted successfully."
}
```

- Activate (200):
```json
{
  "message": "Administrator activated successfully.",
  "data": { "is_active": true }
}
```

- Deactivate (200):
```json
{
  "message": "Administrator deactivated successfully.",
  "data": { "is_active": false }
}
```

## Error Cases
- 403: Not a super admin, attempting to change own role, delete self, or deactivate self.
- 422: Validation errors when creating (invalid email, weak password, invalid role, missing required fields) or when using a duplicate email.
