# API Overview

- Base URL: `/api/v1`
- Common header: `Accept: application/json`
- Authentication:
  - Customer: `Authorization: Bearer <token>` (sanctum)
  - Admin: `Authorization: Bearer <token>` (admin_sanctum) + middleware: `admin.active`, `admin.role`

## Errors
- 401 Unauthorized, 403 Forbidden, 404 Not Found
- 422 Validation Error (field-wise messages)

## Pagination
- Query params: `page`, `per_page`
- Response metadata: `meta.total`, `meta.per_page`, `meta.current_page`

## Rate Limits
- Login endpoints may be throttled (e.g., `throttle:5,1`)
