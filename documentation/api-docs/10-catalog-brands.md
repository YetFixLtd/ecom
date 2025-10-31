# Catalog: Brands

## Summary
CRUD for brands.

## Auth
- Protected: `auth:admin_sanctum`, `admin.active`, roles: `super_admin,admin`

## Endpoints
- GET /api/v1/admin/brands
- POST /api/v1/admin/brands
- GET /api/v1/admin/brands/{id}
- PUT /api/v1/admin/brands/{id}
- DELETE /api/v1/admin/brands/{id}

## Request/Response Examples

### POST /admin/brands
Request
```json
{ "name": "Acme", "slug": "acme", "website_url": "https://acme.test", "logo_url": "https://cdn.test/acme.png" }
```
Response 201
```json
{ "id": 1, "name": "Acme", "slug": "acme", "website_url": "https://acme.test", "logo_url": "https://cdn.test/acme.png" }
```

### PUT /admin/brands/{id}
Request
```json
{ "slug": "acme-inc" }
```
Response 200
```json
{ "id": 1, "name": "Acme", "slug": "acme-inc" }
```

### GET /admin/brands
Response 200
```json
{ "data": [{ "id": 1, "name": "Acme" }], "meta": { "total": 1, "per_page": 15, "current_page": 1 } }
```

### GET /admin/brands/{id}
Response 200
```json
{ "id": 1, "name": "Acme", "slug": "acme" }
```

### DELETE /admin/brands/{id}
Response 200
```json
{ "message": "Deleted" }
```

### Errors
422 Validation
```json
{ "message": "The given data was invalid.", "errors": { "name": ["The name has already been taken."] } }
```
