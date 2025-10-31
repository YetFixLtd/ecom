# Catalog: Products

## Summary
List, create, view, update, delete products. Supports variants, images, and inventory.

## Auth
- Protected: `auth:admin_sanctum`, `admin.active`, roles: `super_admin,admin`

## Endpoints
- GET /api/v1/admin/products
- POST /api/v1/admin/products
- GET /api/v1/admin/products/{id}
- PUT /api/v1/admin/products/{id}
- PATCH /api/v1/admin/products/{id}
- DELETE /api/v1/admin/products/{id}

## Request Schema
- POST /admin/products (ProductStoreRequest)
  - required: name (string, max 255), product_type (enum: simple|variant|bundle)
  - optional: slug, short_description, description, brand_id, published_status (draft|published|archived), visibility (catalog|search|hidden), tax_class, hs_code, weight_grams, length_mm, width_mm, height_mm, is_featured, is_active, seo_title, seo_description, sort_order
  - categories: array<int:id>
  - images: up to 3 files (if multipart) or URLs depending on implementation
  - variants (required if product_type=variant): array of
    - sku (required), barcode, price (required), compare_at_price, cost_price, currency, track_stock, allow_backorder, weight_grams, length_mm, width_mm, height_mm, status (active|inactive)
    - attribute_values: [{ attribute_id, attribute_value_id }]
    - inventory: [{ warehouse_id, on_hand }]
- PUT/PATCH /admin/products/{id} (ProductUpdateRequest)
  - same fields as above, mostly "sometimes"; variants may include id for updates

## Request/Response Examples

### GET /admin/products
Response 200
```json
{
  "data": [
    { "id": 1, "name": "Test Product", "product_type": "variant" }
  ],
  "meta": { "total": 1, "per_page": 15, "current_page": 1 }
}
```

### POST /admin/products (simple)
Request (multipart or JSON depending on images handling)
```json
{
  "name": "Simple Tee",
  "product_type": "simple",
  "brand_id": 1,
  "categories": [1, 2]
}
```
Response 201
```json
{ "id": 10, "name": "Simple Tee", "product_type": "simple", "brand_id": 1 }
```

### POST /admin/products (variant)
Request (from tests)
```json
{
  "name": "Test Product",
  "slug": "test-product",
  "product_type": "variant",
  "brand_id": 1,
  "categories": [1],
  "variants": [
    {
      "sku": "TEST-RED-L",
      "price": 29.99,
      "attribute_values": [
        { "attribute_id": 1, "attribute_value_id": 1 },
        { "attribute_id": 2, "attribute_value_id": 2 }
      ],
      "inventory": [
        { "warehouse_id": 1, "on_hand": 100 }
      ]
    }
  ]
}
```
Response 201
```json
{
  "id": 11,
  "name": "Test Product",
  "product_type": "variant",
  "variants": [
    { "id": 101, "sku": "TEST-RED-L", "price": 29.99 }
  ]
}
```

### GET /admin/products/{id}
Response 200
```json
{
  "id": 11,
  "name": "Test Product",
  "product_type": "variant",
  "categories": [ { "id": 1, "name": "Category" } ],
  "variants": [ { "id": 101, "sku": "TEST-RED-L" } ]
}
```

### PUT /admin/products/{id}
Request
```json
{ "name": "Updated Product", "product_type": "simple" }
```
Response 200
```json
{ "id": 11, "name": "Updated Product" }
```

### DELETE /admin/products/{id}
Response 200
```json
{ "message": "Deleted" }
```

### Errors
422 Validation
```json
{ "message": "The given data was invalid.", "errors": { "images": ["The images may not have more than 3 items."] } }
```
