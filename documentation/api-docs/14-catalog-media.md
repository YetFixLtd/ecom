# Catalog: Media

## Summary
Upload and manage media associated with products.

## Auth
- Protected: `auth:admin_sanctum`, `admin.active`, roles: `super_admin,admin`

## Endpoints
- GET /api/v1/admin/products/{productId}/images
- POST /api/v1/admin/products/{productId}/images
- DELETE /api/v1/admin/products/{productId}/images/{imageId}

## Request/Response Examples

### GET /admin/products/{productId}/images
Response 200
```json
{
  "data": [
    { "id": 10, "url": "https://cdn.test/p1.jpg", "is_primary": true },
    { "id": 11, "url": "https://cdn.test/p2.jpg", "is_primary": false }
  ]
}
```

### POST /admin/products/{productId}/images
Request
```json
{ "url": "https://cdn.test/p1.jpg", "alt_text": "Front", "position": 0, "is_primary": true }
```
Response 201
```json
{ "id": 12, "url": "https://cdn.test/p1.jpg", "alt_text": "Front", "position": 0, "is_primary": true }
```

### DELETE /admin/products/{productId}/images/{imageId}
Response 200
```json
{ "message": "Image deleted successfully" }
```

### Errors
422 Validation
```json
{ "message": "The given data was invalid.", "errors": { "url": ["The url field is required."] } }
```
