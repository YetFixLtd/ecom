# Database Schema - Complete Reference

## Overview
This document describes the complete database structure for the e-commerce application with **32 tables** organized into logical groups.

---

## Table Summary

**Total Tables: 32**
- Laravel Default: 3 (users, cache, jobs)
- Custom E-commerce: 29 tables
- Categories: 7 groups

---

## 1. User Management (3 tables)

### users
Customer accounts for the e-commerce store.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| email | string(191) | Unique email |
| password_hash | string(255) | Hashed password |
| first_name | string(100) | First name |
| last_name | string(100) | Last name |
| phone | string(50) | Phone number |
| is_active | boolean | Active status |
| email_verified_at | timestamp | Email verification |
| deleted_at | timestamp | Soft delete |
| created_at, updated_at | timestamps | Timestamps |

**Indexes:** `email (unique)`, `(last_name, first_name)`

**Related Tables:**
- Has many: `addresses`, `carts`, `orders`

---

### administrators
Staff and admin accounts for system management.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| email | string(191) | Unique email |
| password_hash | string(255) | Hashed password |
| first_name | string(100) | First name |
| last_name | string(100) | Last name |
| phone | string(50) | Phone number |
| role | string(50) | Role (super_admin, admin, manager, staff, worker) |
| is_active | boolean | Active status |
| email_verified_at | timestamp | Email verification |
| last_login_at | timestamp | Last login |
| deleted_at | timestamp | Soft delete |
| created_at, updated_at | timestamps | Timestamps |

**Indexes:** `email (unique)`, `(role, is_active)`, `(last_name, first_name)`

**Roles Hierarchy:**
- super_admin → Full access
- admin → Administrative access
- manager → Management access
- staff → Standard access
- worker → Limited access

**Related Tables:**
- Referenced by: `inventory_movements.performed_by`, `inventory_adjustments.performed_by`, `transfers.created_by`

---

### addresses
User shipping and billing addresses.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| user_id | bigint | Foreign key to users |
| name | string(191) | Address label (e.g., "Home") |
| contact_name | string(191) | Contact person |
| phone | string(50) | Phone number |
| line1 | string(191) | Address line 1 |
| line2 | string(191) | Address line 2 |
| city | string(120) | City |
| state_region | string(120) | State/region |
| postal_code | string(30) | Postal code |
| country_code | char(2) | ISO country code (default: 'BD') |
| is_default_billing | boolean | Default billing flag |
| is_default_shipping | boolean | Default shipping flag |
| created_at, updated_at | timestamps | Timestamps |

**Indexes:** `user_id`, `(country_code, state_region, city)`

**Foreign Keys:**
- `user_id` REFERENCES `users(id)` ON DELETE SET NULL

---

## 2. Catalog Management (5 tables)

### brands
Product brands/manufacturers.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| name | string(191) | Brand name |
| slug | string(191) | URL slug (unique) |
| website_url | string(255) | Brand website |
| logo_url | string(255) | Brand logo |
| created_at, updated_at | timestamps | Timestamps |

**Indexes:** `name (unique)`, `slug (unique)`

**Related Tables:**
- Has many: `products`

---

### categories
Hierarchical product categories.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| parent_id | bigint | Parent category (self-reference) |
| name | string(191) | Category name |
| slug | string(191) | URL slug (unique) |
| path | string(1000) | Full path (e.g., "/men/shoes") |
| position | integer | Sort order |
| created_at, updated_at | timestamps | Timestamps |

**Indexes:** `slug (unique)`, `parent_id`

**Foreign Keys:**
- `parent_id` REFERENCES `categories(id)` ON DELETE SET NULL

**Related Tables:**
- Belongs to: `parent` (Category)
- Has many: `children` (Category)
- Many-to-many: `products` (via product_categories)

---

### products
Main product information.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| name | string(255) | Product name |
| slug | string(255) | URL slug (unique) |
| short_description | string(500) | Short description |
| description | mediumtext | Full description |
| brand_id | bigint | Foreign key to brands |
| product_type | enum | Type: simple, variant, bundle |
| published_status | enum | Status: draft, published, archived |
| visibility | enum | Visibility: catalog, search, hidden |
| tax_class | string(64) | Tax classification |
| hs_code | string(32) | Harmonized system code |
| weight_grams | integer | Weight in grams |
| length_mm, width_mm, height_mm | integer | Dimensions |
| is_featured | boolean | Featured flag |
| is_active | boolean | Active flag |
| seo_title | string(191) | SEO title |
| seo_description | string(255) | SEO description |
| sort_order | integer | Display order |
| deleted_at | timestamp | Soft delete |
| created_at, updated_at | timestamps | Timestamps |

**Indexes:** `slug (unique)`, `brand_id`, `(published_status, is_active)`

**Foreign Keys:**
- `brand_id` REFERENCES `brands(id)` ON DELETE SET NULL

**Related Tables:**
- Belongs to: `brand`
- Has many: `categories` (many-to-many), `images`, `variants`, `files`, `meta`
- Belongs to many: `categories` (via product_categories)

---

### product_categories
Pivot table linking products to categories.

| Column | Type | Description |
|--------|------|-------------|
| product_id | bigint | Foreign key to products |
| category_id | bigint | Foreign key to categories |

**Primary Key:** `(product_id, category_id)`

**Foreign Keys:**
- `product_id` REFERENCES `products(id)` ON DELETE CASCADE
- `category_id` REFERENCES `categories(id)` ON DELETE RESTRICT

---

### product_images
Product images with ordering.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| product_id | bigint | Foreign key to products |
| url | string(255) | Image URL |
| alt_text | string(255) | Alt text |
| position | integer | Display order |
| is_primary | boolean | Primary image flag |
| created_at, updated_at | timestamps | Timestamps |

**Indexes:** `product_id`, `(product_id, is_primary)`

**Foreign Keys:**
- `product_id` REFERENCES `products(id)` ON DELETE CASCADE

---

## 3. Attributes & Variants (5 tables)

### attributes
Product attributes (e.g., Color, Size).

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| name | string(100) | Attribute name |
| slug | string(100) | URL slug (unique) |
| position | integer | Display order |
| created_at | no timestamps | |

**Indexes:** `slug (unique)`

**Related Tables:**
- Has many: `values` (AttributeValue)

---

### attribute_values
Specific values for attributes.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| attribute_id | bigint | Foreign key to attributes |
| value | string(100) | Value name |
| value_key | string(100) | Additional key (e.g., hex code) |
| position | integer | Display order |
| created_at | no timestamps | |

**Indexes:** `attribute_id`

**Foreign Keys:**
- `attribute_id` REFERENCES `attributes(id)` ON DELETE CASCADE

---

### product_variants
SKU-level product variations.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| product_id | bigint | Foreign key to products |
| sku | string(100) | Stock keeping unit (unique) |
| barcode | string(100) | Barcode (unique, nullable) |
| price | decimal(12,2) | Selling price |
| compare_at_price | decimal(12,2) | Original/discount price |
| cost_price | decimal(12,2) | Cost price |
| currency | char(3) | Currency code (default: BDT) |
| track_stock | boolean | Track inventory |
| allow_backorder | boolean | Allow backorders |
| weight_grams, length_mm, width_mm, height_mm | integer | Dimensions (overrides) |
| status | enum | Status: active, inactive |
| deleted_at | timestamp | Soft delete |
| created_at, updated_at | timestamps | Timestamps |

**Indexes:** `sku (unique)`, `barcode (unique)`, `product_id`, `status`

**Foreign Keys:**
- `product_id` REFERENCES `products(id)` ON DELETE CASCADE

**Related Tables:**
- Has many: `inventory_items`, `cart_items`, `order_items`, `price_list_items`

---

### variant_attribute_values
Links variants to their attribute combinations.

| Column | Type | Description |
|--------|------|-------------|
| variant_id | bigint | Foreign key to product_variants |
| attribute_id | bigint | Foreign key to attributes |
| attribute_value_id | bigint | Foreign key to attribute_values |

**Primary Key:** `(variant_id, attribute_id)`

**Foreign Keys:**
- `variant_id` REFERENCES `product_variants(id)` ON DELETE CASCADE
- `attribute_id` REFERENCES `attributes(id)` ON DELETE RESTRICT
- `attribute_value_id` REFERENCES `attribute_values(id)` ON DELETE RESTRICT

---

### product_attribute_values
Optional pivot for product-level filtering.

| Column | Type | Description |
|--------|------|-------------|
| product_id | bigint | Foreign key to products |
| attribute_value_id | bigint | Foreign key to attribute_values |

**Primary Key:** `(product_id, attribute_value_id)`

---

## 4. Inventory Management (6 tables)

### warehouses
Physical storage locations.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| name | string(191) | Warehouse name |
| code | string(64) | Warehouse code (unique) |
| address1, address2 | string(255) | Address |
| city | string(120) | City |
| state_region | string(120) | State/region |
| postal_code | string(30) | Postal code |
| country_code | char(2) | ISO country code |
| is_default | boolean | Default warehouse flag |
| created_at, updated_at | timestamps | Timestamps |

**Indexes:** `code (unique)`

---

### inventory_items
Current stock levels per variant per warehouse.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| variant_id | bigint | Foreign key to product_variants |
| warehouse_id | bigint | Foreign key to warehouses |
| on_hand | integer | Physical quantity |
| reserved | integer | Reserved quantity |
| safety_stock | integer | Minimum stock threshold |
| reorder_point | integer | Reorder trigger level |
| created_at, updated_at | timestamps | Timestamps |

**Unique Constraint:** `(variant_id, warehouse_id)`

**Indexes:** `(warehouse_id, variant_id)`

**Available Stock:** `on_hand - reserved` (computed)

---

### inventory_movements
Immutable ledger of all stock changes (audit trail).

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| variant_id | bigint | Foreign key to product_variants |
| warehouse_id | bigint | Foreign key to warehouses |
| qty_change | integer | Quantity change (signed) |
| movement_type | enum | Type: purchase, sale, return_in, return_out, adjustment, transfer_in, transfer_out, production_in, consumption_out, reservation, release |
| reference_type | string(64) | Reference type (e.g., "order") |
| reference_id | bigint | Reference ID |
| unit_cost | decimal(12,2) | Unit cost (for COGS) |
| reason_code | string(64) | Reason code |
| note | string(500) | Notes |
| performed_by | bigint | Foreign key to administrators |
| performed_at | timestamp | When performed |
| created_at | timestamp | When recorded |

**Indexes:** `(variant_id, performed_at)`, `(reference_type, reference_id)`

**Foreign Keys:**
- `performed_by` REFERENCES `administrators(id)` ON DELETE SET NULL

**IMPORTANT:** Never edit existing movements - create compensating entries!

---

### inventory_adjustments
Manual stock corrections (human-initiated).

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| variant_id | bigint | Foreign key to product_variants |
| warehouse_id | bigint | Foreign key to warehouses |
| adjustment_mode | enum | Mode: SET_ON_HAND, DELTA_ON_HAND |
| qty_before | integer | Quantity before |
| qty_change | integer | Quantity change |
| qty_after | integer | Quantity after |
| unit_cost | decimal(12,2) | Unit cost |
| reason_code | string(64) | Reason code |
| note | text | Notes |
| performed_by | bigint | Foreign key to administrators |
| performed_at | timestamp | When performed |
| created_at | timestamp | When recorded |

**Indexes:** `(variant_id, warehouse_id, performed_at)`

**Foreign Keys:**
- `performed_by` REFERENCES `administrators(id)` ON DELETE SET NULL

---

### transfers
Stock transfers between warehouses.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| from_warehouse_id | bigint | Source warehouse |
| to_warehouse_id | bigint | Destination warehouse |
| status | enum | Status: draft, in_transit, received, canceled |
| created_by | bigint | Foreign key to administrators |
| created_at, updated_at | timestamps | Timestamps |

**Foreign Keys:**
- `from_warehouse_id` REFERENCES `warehouses(id)` ON DELETE RESTRICT
- `to_warehouse_id` REFERENCES `warehouses(id)` ON DELETE RESTRICT
- `created_by` REFERENCES `administrators(id)` ON DELETE SET NULL

---

### transfer_items
Line items in warehouse transfers.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| transfer_id | bigint | Foreign key to transfers |
| variant_id | bigint | Foreign key to product_variants |
| qty | integer | Quantity |

**Foreign Keys:**
- `transfer_id` REFERENCES `transfers(id)` ON DELETE CASCADE
- `variant_id` REFERENCES `product_variants(id)` ON DELETE RESTRICT

---

## 5. Pricing (2 tables)

### price_lists
Custom pricing schedules (optional).

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| name | string(191) | Price list name |
| currency | char(3) | Currency code |
| starts_at | timestamp | Start date |
| ends_at | timestamp | End date |
| created_at, updated_at | timestamps | Timestamps |

---

### price_list_items
Variant-specific prices in price lists.

| Column | Type | Description |
|--------|------|-------------|
| price_list_id | bigint | Foreign key to price_lists |
| variant_id | bigint | Foreign key to product_variants |
| price | decimal(12,2) | Custom price |

**Primary Key:** `(price_list_id, variant_id)`

---

## 6. Orders & Payments (7 tables)

### carts
Shopping cart sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| user_id | bigint | Foreign key to users |
| currency | char(3) | Currency code |
| status | enum | Status: open, converted, abandoned |
| created_at, updated_at | timestamps | Timestamps |

**Foreign Keys:**
- `user_id` REFERENCES `users(id)` ON DELETE CASCADE

---

### cart_items
Items in shopping carts.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| cart_id | bigint | Foreign key to carts |
| variant_id | bigint | Foreign key to product_variants |
| qty | integer | Quantity |
| unit_price | decimal(12,2) | Price snapshot |
| created_at, updated_at | timestamps | Timestamps |

**Unique Constraint:** `(cart_id, variant_id)`

---

### orders
Customer orders.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| user_id | bigint | Foreign key to users |
| order_number | string(50) | Unique order number |
| status | enum | Status: pending, paid, fulfilled, canceled, refunded, partial |
| currency | char(3) | Currency code |
| subtotal | decimal(12,2) | Items total |
| discount_total | decimal(12,2) | Discount amount |
| shipping_total | decimal(12,2) | Shipping cost |
| tax_total | decimal(12,2) | Tax amount |
| grand_total | decimal(12,2) | Total amount |
| billing_address_id | bigint | Billing address |
| shipping_address_id | bigint | Shipping address |
| placed_at | timestamp | When placed |
| created_at, updated_at | timestamps | Timestamps |

**Foreign Keys:**
- `user_id` REFERENCES `users(id)` ON DELETE RESTRICT
- `billing_address_id` REFERENCES `addresses(id)` ON DELETE SET NULL
- `shipping_address_id` REFERENCES `addresses(id)` ON DELETE SET NULL

---

### order_items
Line items in orders.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| order_id | bigint | Foreign key to orders |
| variant_id | bigint | Foreign key to product_variants |
| product_name | string(255) | Product name snapshot |
| variant_sku | string(100) | SKU snapshot |
| qty | integer | Quantity |
| unit_price | decimal(12,2) | Unit price |
| discount_total | decimal(12,2) | Discount amount |
| tax_total | decimal(12,2) | Tax amount |
| total | decimal(12,2) | Line total |
| created_at, updated_at | timestamps | Timestamps |

**Foreign Keys:**
- `order_id` REFERENCES `orders(id)` ON DELETE CASCADE
- `variant_id` REFERENCES `product_variants(id)` ON DELETE RESTRICT

---

### payments
Payment transactions.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| order_id | bigint | Foreign key to orders |
| provider | string(64) | Payment provider (stripe, bkash, nagad, cod, ssl_commerz) |
| provider_ref | string(191) | External transaction ID |
| amount | decimal(12,2) | Payment amount |
| currency | char(3) | Currency code |
| status | enum | Status: pending, authorized, captured, failed, refunded |
| paid_at | timestamp | When paid |
| created_at, updated_at | timestamps | Timestamps |

**Indexes:** `(provider, provider_ref)`

**Foreign Keys:**
- `order_id` REFERENCES `orders(id)` ON DELETE CASCADE

---

### fulfillments
Order shipments.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| order_id | bigint | Foreign key to orders |
| status | enum | Status: pending, packed, shipped, delivered, canceled |
| tracking_number | string(100) | Tracking number |
| carrier | string(64) | Carrier name |
| shipped_at | timestamp | When shipped |
| delivered_at | timestamp | When delivered |
| created_at, updated_at | timestamps | Timestamps |

**Foreign Keys:**
- `order_id` REFERENCES `orders(id)` ON DELETE CASCADE

---

### fulfillment_items
Items in fulfillments (supports partial shipments).

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| fulfillment_id | bigint | Foreign key to fulfillments |
| order_item_id | bigint | Foreign key to order_items |
| qty | integer | Quantity fulfilled |

**Foreign Keys:**
- `fulfillment_id` REFERENCES `fulfillments(id)` ON DELETE CASCADE
- `order_item_id` REFERENCES `order_items(id)` ON DELETE RESTRICT

---

## 7. Content & Meta (2 tables)

### product_files
Downloadable files for products.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| product_id | bigint | Foreign key to products |
| file_url | string(255) | File URL |
| title | string(191) | File title |
| created_at, updated_at | timestamps | Timestamps |

**Foreign Keys:**
- `product_id` REFERENCES `products(id)` ON DELETE CASCADE

---

### product_meta
Custom key-value metadata.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| product_id | bigint | Foreign key to products |
| meta_key | string(100) | Meta key |
| meta_value | text | Meta value |

**Unique Constraint:** `(product_id, meta_key)`

**Foreign Keys:**
- `product_id` REFERENCES `products(id)` ON DELETE CASCADE

---

## Key Relationships

### User vs Administrator Separation

**Users (Customers):**
- Can have addresses, carts, orders
- Customer-facing operations only
- Referenced by: `orders.user_id`, `carts.user_id`, `addresses.user_id`

**Administrators (Staff):**
- Perform inventory operations
- System management only
- Referenced by: `inventory_movements.performed_by`, `inventory_adjustments.performed_by`, `transfers.created_by`

### Inventory Flow

```
Order Placed
  → inventory_movements: movement_type='reservation'
  → inventory_items.reserved: +qty

Order Fulfilled
  → inventory_movements: movement_type='sale' (reduce on_hand)
  → inventory_movements: movement_type='release' (reduce reserved)

Adjustment
  → inventory_adjustments: manual correction
  → inventory_movements: movement_type='adjustment' (audit trail)
```

---

## Last Updated
**Date:** October 27, 2025  
**Total Tables:** 32  
**Status:** Complete & Production Ready

