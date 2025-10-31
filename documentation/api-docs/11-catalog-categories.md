# Catalog: Categories

## Summary
CRUD for categories.

## Auth
- Protected: `auth:admin_sanctum`, `admin.active`, roles: `super_admin,admin`

## Endpoints
- GET /api/v1/admin/categories
- POST /api/v1/admin/categories
- GET /api/v1/admin/categories/{id}
- PUT /api/v1/admin/categories/{id}
- DELETE /api/v1/admin/categories/{id}

## Request/Response Examples

### POST /admin/categories
Request
```json
{ "name": "Shoes", "slug": "shoes", "parent_id": null, "position": 1 }
```
Response 201
```json
{ "id": 2, "name": "Shoes", "slug": "shoes", "parent_id": null, "position": 1 }
```

### PUT /admin/categories/{id}
Request
```json
{ "parent_id": 1, "position": 5 }
```
Response 200
```json
{ "id": 2, "name": "Shoes", "parent_id": 1, "position": 5 }
```

### GET /admin/categories
Response 200
```json
{ "data": [{ "id": 2, "name": "Shoes" }], "meta": { "total": 1, "per_page": 15, "current_page": 1 } }
```

### GET /admin/categories/{id}
Response 200
```json
{ "id": 2, "name": "Shoes", "slug": "shoes" }
```

### DELETE /admin/categories/{id}
Response 200
```json
{ "message": "Deleted" }
```

### Errors
422 Validation
```json
{ "message": "The given data was invalid.", "errors": { "parent_id": ["The selected parent id is invalid."] } }
```
