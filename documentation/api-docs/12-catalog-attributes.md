# Catalog: Attributes

## Summary
CRUD for attributes.

## Auth
- Protected: `auth:admin_sanctum`, `admin.active`, roles: `super_admin,admin`

## Endpoints
- GET /api/v1/admin/attributes
- POST /api/v1/admin/attributes
- GET /api/v1/admin/attributes/{id}
- PUT /api/v1/admin/attributes/{id}
- DELETE /api/v1/admin/attributes/{id}

## Request/Response Examples

### POST /admin/attributes
Request
```json
{ "name": "Color", "slug": "color", "position": 10 }
```
Response 201
```json
{ "id": 1, "name": "Color", "slug": "color", "position": 10 }
```

### PUT /admin/attributes/{id}
Request
```json
{ "position": 20 }
```
Response 200
```json
{ "id": 1, "name": "Color", "position": 20 }
```

### GET /admin/attributes
Response 200
```json
{ "data": [{ "id": 1, "name": "Color" }], "meta": { "total": 1, "per_page": 15, "current_page": 1 } }
```

### GET /admin/attributes/{id}
Response 200
```json
{ "id": 1, "name": "Color", "slug": "color" }
```

### DELETE /admin/attributes/{id}
Response 200
```json
{ "message": "Deleted" }
```

### Errors
422 Validation
```json
{ "message": "The given data was invalid.", "errors": { "name": ["The name field is required."] } }
```
