# E-Commerce Database Structure

This document provides an overview of the complete database structure for the e-commerce system.

## Overview

The database is organized into 7 logical groups:
1. **Users & Addresses** - User authentication and address management
2. **Catalog** - Products, brands, categories, and images
3. **Attributes & Variants** - Product variations and attributes (color, size, etc.)
4. **Inventory** - Multi-warehouse stock management and movements
5. **Pricing** - Optional price lists for different customer segments
6. **Orders** - Cart, checkout, orders, payments, and fulfillments
7. **Content** - Product files and metadata

## Model Organization

Models are organized into namespaced folders for better maintainability:

```
app/Models/
├── User.php (main user model)
├── User/
│   └── Address.php
├── Catalog/
│   ├── Brand.php
│   ├── Category.php
│   ├── Product.php
│   └── ProductImage.php
├── Attribute/
│   ├── Attribute.php
│   ├── AttributeValue.php
│   ├── ProductVariant.php
│   └── VariantAttributeValue.php
├── Inventory/
│   ├── Warehouse.php
│   ├── InventoryItem.php
│   ├── InventoryMovement.php
│   ├── InventoryAdjustment.php
│   ├── Transfer.php
│   └── TransferItem.php
├── Pricing/
│   ├── PriceList.php
│   └── PriceListItem.php
├── Order/
│   ├── Cart.php
│   ├── CartItem.php
│   ├── Order.php
│   ├── OrderItem.php
│   ├── Payment.php
│   ├── Fulfillment.php
│   └── FulfillmentItem.php
└── Content/
    ├── ProductFile.php
    └── ProductMeta.php
```

## Database Tables

### 1. Users & Addresses (2 tables)

#### `users`
- Primary user/customer accounts
- Supports soft deletes
- Fields: email, password_hash, first_name, last_name, phone, is_active, email_verified_at
- Relationships: addresses, carts, orders

#### `addresses`
- User shipping/billing addresses
- Multiple addresses per user with default flags
- Fields: user_id, name, contact_name, phone, line1, line2, city, state_region, postal_code, country_code
- Relationships: user, orders (as billing/shipping)

### 2. Catalog (5 tables)

#### `brands`
- Product brands/manufacturers
- Fields: name, slug, website_url, logo_url
- Relationships: products

#### `categories`
- Hierarchical product categories
- Self-referential parent-child structure
- Fields: parent_id, name, slug, path, position
- Relationships: parent, children, products (many-to-many)

#### `products`
- Main product information
- Supports soft deletes
- Product types: simple, variant, bundle
- Published status: draft, published, archived
- Fields: name, slug, descriptions, brand_id, dimensions, SEO fields, is_featured, is_active
- Relationships: brand, categories, images, variants, files, meta

#### `product_categories`
- Pivot table linking products to categories
- Composite primary key (product_id, category_id)

#### `product_images`
- Multiple images per product with ordering
- Fields: product_id, url, alt_text, position, is_primary
- Relationships: product

### 3. Attributes & Variants (5 tables)

#### `attributes`
- Configurable attributes (Color, Size, Material, etc.)
- Fields: name, slug, position
- Relationships: values, variant_attribute_values

#### `attribute_values`
- Possible values for attributes (Red, Blue, Large, Small, etc.)
- Fields: attribute_id, value, value_key (e.g., HEX for colors), position
- Relationships: attribute, products (via pivot), variants (via pivot)

#### `product_attribute_values`
- Optional pivot for product-level filtering
- Links products to attribute values for faceted search

#### `product_variants`
- SKU-level product variations
- Supports soft deletes
- Fields: product_id, sku, barcode, pricing, cost, dimensions, track_stock, allow_backorder, status
- Relationships: product, attribute_values, inventory_items, cart_items, order_items

#### `variant_attribute_values`
- Links variants to their specific attribute combinations
- One value per attribute per variant
- Composite primary key ensures unique attribute per variant

### 4. Inventory (6 tables)

#### `warehouses`
- Physical storage locations
- Fields: name, code, address fields, is_default
- Relationships: inventory_items, movements, adjustments, transfers

#### `inventory_items`
- Current stock levels per variant per warehouse
- Fields: variant_id, warehouse_id, on_hand, reserved, safety_stock, reorder_point
- Available = on_hand - reserved (computed)
- Unique constraint: (variant_id, warehouse_id)
- Relationships: variant, warehouse

#### `inventory_movements`
- **Immutable ledger** of all stock changes
- Movement types: purchase, sale, return_in/out, adjustment, transfer_in/out, production_in, consumption_out, reservation, release
- Fields: variant_id, warehouse_id, qty_change (signed), movement_type, reference_type/id, unit_cost, reason_code, performed_by/at
- Never edit existing movements - create compensating entries
- Relationships: variant, warehouse, performed_by (user)

#### `inventory_adjustments`
- Human-initiated stock corrections
- Adjustment modes: SET_ON_HAND, DELTA_ON_HAND
- Fields: variant_id, warehouse_id, adjustment_mode, qty_before/change/after, unit_cost, reason_code, performed_by/at
- Creates corresponding inventory_movement record
- Relationships: variant, warehouse, performed_by (user)

#### `transfers`
- Stock transfers between warehouses
- Status: draft, in_transit, received, canceled
- Fields: from_warehouse_id, to_warehouse_id, status, created_by
- Relationships: from_warehouse, to_warehouse, created_by (user), items

#### `transfer_items`
- Line items in transfers
- Fields: transfer_id, variant_id, qty
- Relationships: transfer, variant

### 5. Pricing (2 tables)

#### `price_lists`
- Optional custom pricing schedules
- Fields: name, currency, starts_at, ends_at
- Use cases: customer segments, regions, promotional periods
- Relationships: items

#### `price_list_items`
- Variant-specific prices in price lists
- Composite primary key (price_list_id, variant_id)
- Fields: price_list_id, variant_id, price
- Relationships: price_list, variant

### 6. Orders (7 tables)

#### `carts`
- Shopping cart sessions
- Status: open, converted, abandoned
- Fields: user_id (nullable for guest), currency, status
- Relationships: user, items

#### `cart_items`
- Items in shopping carts
- Price snapshot at add-time
- Unique constraint: (cart_id, variant_id)
- Fields: cart_id, variant_id, qty, unit_price
- Relationships: cart, variant

#### `orders`
- Customer orders
- Status: pending, paid, fulfilled, canceled, refunded, partial
- Fields: user_id, order_number, status, currency, totals (subtotal, discount, shipping, tax, grand_total), address_ids, placed_at
- Relationships: user, billing_address, shipping_address, items, payments, fulfillments

#### `order_items`
- Line items in orders
- **Snapshots** product/variant data at order time
- Fields: order_id, variant_id, product_name, variant_sku, qty, unit_price, discount_total, tax_total, total
- Relationships: order, variant, fulfillment_items

#### `payments`
- Payment transactions
- Providers: stripe, bkash, nagad, etc.
- Status: pending, authorized, captured, failed, refunded
- Fields: order_id, provider, provider_ref, amount, currency, status, paid_at
- Relationships: order

#### `fulfillments`
- Order shipments
- Status: pending, packed, shipped, delivered, canceled
- Fields: order_id, status, tracking_number, carrier, shipped_at, delivered_at
- Relationships: order, items

#### `fulfillment_items`
- Items in shipments (supports partial fulfillment)
- Fields: fulfillment_id, order_item_id, qty
- Relationships: fulfillment, order_item

### 7. Content (2 tables)

#### `product_files`
- Downloadable files/documents
- Use cases: manuals, certificates, digital goods
- Fields: product_id, file_url, title
- Relationships: product

#### `product_meta`
- Custom key-value metadata
- Flexible storage without schema changes
- Unique constraint: (product_id, meta_key)
- Fields: product_id, meta_key, meta_value
- Relationships: product

## Key Business Rules

### Inventory Management
1. Every stock change creates an `inventory_movement` record (append-only ledger)
2. Available stock = `on_hand - reserved`
3. When order placed: create `reservation` movement, increase `reserved`
4. When order fulfilled: create `sale` movement (decrease `on_hand`), create `release` movement (decrease `reserved`)
5. When order canceled: create `release` movement to free reservations
6. Never edit existing movements - create compensating entries

### Product Publishing
1. Published products (`published_status = published`) must have at least one active variant
2. Products must be both `published` and `is_active = true` to be visible

### Stock Tracking
1. If `track_stock = false`, skip reservations (except sale movements for analytics)
2. Available stock must not drop below zero unless `allow_backorder = true`

### Foreign Key Constraints
- Most relationships use `ON DELETE RESTRICT` to prevent accidental data loss
- Child tables that are pure children use `CASCADE` (e.g., order_items, cart_items)
- Optional relationships use `SET NULL` (e.g., brand_id on products)

## Indexing Strategy

### Primary Indexes
- All tables have `id` as primary key (bigint auto-increment)
- Composite primary keys on pivot tables

### Foreign Key Indexes
- Automatically indexed on all foreign keys

### Additional Indexes
- `users`: (last_name, first_name) for name searches
- `addresses`: (country_code, state_region, city) for location filtering
- `products`: (published_status, is_active) for catalog queries
- `product_images`: (product_id, is_primary) for quick primary image lookup
- `inventory_movements`: (variant_id, performed_at), (reference_type, reference_id)
- `inventory_items`: (warehouse_id, variant_id) for stock lookups
- `payments`: (provider, provider_ref) for external reference tracking

## Data Types & Conventions

### Naming Conventions
- Tables: snake_case, plural
- Columns: snake_case
- Primary keys: `id`
- Foreign keys: `{table}_id`
- Timestamps: `created_at`, `updated_at`, `deleted_at` (soft delete)

### Monetary Fields
- Type: `DECIMAL(12,2)`
- Currency: `CHAR(3)` (ISO 4217 codes)

### String Lengths
- Names/titles: 191 characters (for MySQL utf8mb4 index limits)
- URLs: 255 characters
- Short text: 500 characters
- Long text: TEXT or MEDIUMTEXT

### Enums
All enums are implemented as string enums in migrations for better readability.

## Running Migrations

To run all migrations:
```bash
cd backend
php artisan migrate
```

To check migration status:
```bash
php artisan migrate:status
```

To rollback:
```bash
php artisan migrate:rollback
```

To fresh migrate (WARNING: destroys data):
```bash
php artisan migrate:fresh
```

## Model Usage Examples

### Creating a Product with Variants
```php
use App\Models\Catalog\Product;
use App\Models\Attribute\ProductVariant;

$product = Product::create([
    'name' => 'T-Shirt',
    'slug' => 't-shirt',
    'product_type' => 'variant',
    'published_status' => 'published',
    'is_active' => true,
]);

// Create variant
$variant = ProductVariant::create([
    'product_id' => $product->id,
    'sku' => 'TSHIRT-RED-L',
    'price' => 19.99,
    'currency' => 'BDT',
    'status' => 'active',
]);
```

### Checking Inventory
```php
use App\Models\Inventory\InventoryItem;

$inventory = InventoryItem::where('variant_id', $variantId)
    ->where('warehouse_id', $warehouseId)
    ->first();

$available = $inventory->available; // on_hand - reserved
$needsReorder = $inventory->needsReorder();
```

### Creating an Order
```php
use App\Models\Order\Order;
use App\Models\Order\OrderItem;

$order = Order::create([
    'user_id' => $userId,
    'order_number' => 'ORD-' . time(),
    'status' => 'pending',
    'currency' => 'BDT',
    'subtotal' => 100.00,
    'grand_total' => 110.00,
]);

OrderItem::create([
    'order_id' => $order->id,
    'variant_id' => $variantId,
    'product_name' => 'T-Shirt',
    'variant_sku' => 'TSHIRT-RED-L',
    'qty' => 2,
    'unit_price' => 19.99,
    'total' => 39.98,
]);
```

## Next Steps

1. **Create Seeders**: Generate sample data for testing
2. **Add Validation**: Implement Form Request classes for input validation
3. **Create Controllers**: Build API endpoints for each resource
4. **Add Authorization**: Implement policies for access control
5. **Create Services**: Extract business logic into service classes
6. **Add Events**: Trigger inventory movements on order status changes
7. **Implement Search**: Add Elasticsearch/Algolia for product search
8. **Add Observers**: Handle automatic slug generation, inventory updates, etc.

## Support

For questions or issues, refer to the Laravel documentation:
- [Eloquent ORM](https://laravel.com/docs/eloquent)
- [Migrations](https://laravel.com/docs/migrations)
- [Relationships](https://laravel.com/docs/eloquent-relationships)

