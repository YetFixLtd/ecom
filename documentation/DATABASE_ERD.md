# Database Entity Relationship Diagram (ERD)

## Complete ERD for E-Commerce System (32 Tables)

---

## 1. USER & ADMINISTRATION LAYER

```
+------------------+                    +------------------+
|     Users        |                    | Administrators   |
|  (Customers)     |                    |    (Staff)       |
+------------------+                    +------------------+
| - id (PK)        |                    | - id (PK)        |
| - email          |                    | - email          |
| - first_name     |                    | - first_name     |
| - last_name      |                    | - last_name      |
| - phone          |                    | - role           |
| - is_active      |                    | - is_active      |
| - soft_deletes   |                    | - last_login_at  |
+--------+---------+                    | - soft_deletes   |
         |                              +--------+---------+
         |                                       |
         | 1:N                                   |
         |                                       |
   +-----+------+                                |
   |            |                                |
   v            v                                v
+----------+ +-------+                  +------------------+
|Addresses | | Carts |                  | Inventory Ops:   |
+----------+ +-------+                  | - movements      |
| Orders   |                            | - adjustments    |
+----------+                            | - transfers      |
                                        +------------------+
```

---

## 2. CATALOG SYSTEM

```
+------------------+
|     Brands       |
+------------------+
| - id (PK)        |
| - name           |
| - slug           |
| - website_url    |
+--------+---------+
         |
         | 1:N
         |
         v
+------------------+
|    Products      |
+------------------+
| - id (PK)        |
| - name, slug     |
| - description    |
| - brand_id (FK)  |
| - product_type   |
| - published_status
| - visibility     |
| - is_featured    |
| - is_active      |
| - dimensions     |
| - soft_deletes   |
+--------+---------+
         |
         +----------+-----------+-----------+
         |          |           |           |
         v          v           v           v
   +---------+ +---------+ +---------+ +---------+
   | Images  | |Variants | |Categories| | Files |
   +---------+ +---------+ +---------+ |  Meta  |
                           |  (M:M)   | +---------+
                           +---------+
                           | Hierarchical
                           | - parent_id
                           +---------+
```

---

## 3. ATTRIBUTES & VARIANTS SYSTEM

```
+------------------+
|   Attributes     |
| (Color, Size...) |
+------------------+
| - id (PK)        |
| - name           |
| - slug           |
+--------+---------+
         |
         | 1:N
         v
+------------------+
| Attribute Values |
| (Red, Large...)  |
+------------------+
| - id (PK)        |
| - attribute_id   |
| - value          |
+--------+---------+
         |
         |
         +-------------+
         |             |
         v             v
  +----------+   +-------------------+
  | Product  |   | Product Variants  |
  | Attrs    |   |      (SKUs)       |
  | (M:M)    |   +-------------------+
  +----------+   | - id (PK)         |
                 | - product_id (FK) |
                 | - sku (unique)    |
                 | - barcode         |
                 | - price           |
                 | - compare_at_price|
                 | - cost_price      |
                 | - track_stock     |
                 | - allow_backorder |
                 | - status          |
                 | - soft_deletes    |
                 +--------+----------+
                          |
                          +------------ variant_attribute_values (M:M)
                          |
                          +--- Used in:
                               - inventory_items
                               - cart_items
                               - order_items
                               - price_list_items
```

---

## 4. INVENTORY MANAGEMENT SYSTEM

```
+------------------+
|   Warehouses     |
+------------------+
| - id (PK)        |
| - code (unique)  |
| - name           |
| - address        |
| - is_default     |
+--------+---------+
         |
         | 1:N
         v
+---------------------------+
|    Inventory Items        |
| (Current Stock Levels)    |
+---------------------------+
| - id (PK)                 |
| - variant_id (FK)         |
| - warehouse_id (FK)       |
| - on_hand (physical qty)  |
| - reserved (for orders)   |
| - safety_stock            |
| - reorder_point           |
|                           |
| available = on_hand - reserved
+---------------------------+

+------------------------------------+
|   Inventory Movements (LEDGER)    |
|   Immutable Audit Trail           |
+------------------------------------+
| - id (PK)                          |
| - variant_id (FK)                  |
| - warehouse_id (FK)                |
| - qty_change (signed: +/-)         |
| - movement_type:                   |
|   * purchase, sale                 |
|   * return_in, return_out          |
|   * adjustment                     |
|   * transfer_in, transfer_out      |
|   * reservation, release           |
| - reference_type, reference_id     |
| - unit_cost (for COGS)             |
| - performed_by (FK -> Admin) ✓     |
| - performed_at                     |
+------------------------------------+

+------------------------------------+
| Inventory Adjustments (Manual)    |
+------------------------------------+
| - id (PK)                          |
| - variant_id (FK)                  |
| - warehouse_id (FK)                |
| - adjustment_mode:                 |
|   * SET_ON_HAND                    |
|   * DELTA_ON_HAND                  |
| - qty_before, qty_change, qty_after|
| - reason_code, note                |
| - performed_by (FK -> Admin) ✓     |
| - performed_at                     |
+------------------------------------+

+------------------+       1:N       +------------------+
|    Transfers     |---------------->| Transfer Items   |
+------------------+                 +------------------+
| - id (PK)        |                 | - transfer_id    |
| - from_warehouse |                 | - variant_id     |
| - to_warehouse   |                 | - qty            |
| - status         |                 +------------------+
| - created_by (FK -> Admin) ✓
+------------------+
```

---

## 5. ORDER SYSTEM

```
+------------------+
|      Carts       |
| (Shopping Cart)  |
+------------------+
| - id (PK)        |
| - user_id (FK)   |
| - currency       |
| - status         |
+--------+---------+
         |
         | 1:N
         v
+------------------+
|   Cart Items     |
+------------------+
| - cart_id (FK)   |
| - variant_id (FK)|
| - qty            |
| - unit_price     |
+------------------+

         |
         | Cart Converted
         v

+---------------------------+
|         Orders            |
+---------------------------+
| - id (PK)                 |
| - user_id (FK)            |
| - order_number (unique)   |
| - status                  |
| - subtotal                |
| - discount_total          |
| - shipping_total          |
| - tax_total               |
| - grand_total             |
| - billing_address_id (FK) |
| - shipping_address_id (FK)|
| - placed_at               |
+-----+----------+----------+
      |          |          |
      | 1:N      | 1:N      | 1:N
      v          v          v
+----------+ +----------+ +-------------+
|  Order   | | Payments | |Fulfillments |
|  Items   | +----------+ +-------------+
+----------+ | - provider| | - tracking  |
|- variant | | - status  | | - carrier   |
|- product | | - amount  | | - status    |
|  name    | | - paid_at | | - shipped_at|
|(snapshot)| | - COD     | +------+------+
|- qty     | | - bKash   |        |
|- price   | | - Nagad   |        | 1:N
+----+-----+ | - Stripe  |        v
     |       +----------+ +-------------+
     |                    | Fulfillment |
     +------------------->|   Items     |
                          +-------------+
                          | Links order |
                          | items to    |
                          | shipments   |
                          | (partial    |
                          | fulfillment)|
                          +-------------+
```

---

## 6. PRICING SYSTEM (Optional)

```
+------------------+
|   Price Lists    |
+------------------+
| - id (PK)        |
| - name           |
| - currency       |
| - starts_at      |
| - ends_at        |
+--------+---------+
         |
         | 1:N
         v
+------------------+
| Price List Items |
+------------------+
| - price_list_id  |
| - variant_id (FK)|
| - price          |
+------------------+

Use Cases:
- Wholesale pricing
- Regional pricing
- Time-based sales
- Customer segment pricing
```

---

## 7. CONTENT & META

```
+---------+        +-----------+
|Products |------->| Product   |
|         |   1:N  | Files     |
+---------+        +-----------+
     |             | - file_url|
     |             | - title   |
     |             +-----------+
     |
     | 1:N
     v
+-----------+
| Product   |
| Meta      |
+-----------+
| - meta_key|
| - meta_val|
+-----------+
```

---

## KEY RELATIONSHIPS SUMMARY

### User Separation Pattern

```
Users (Customers)               Administrators (Staff)
    |                                    |
    +-- addresses                        +-- inventory_movements.performed_by
    +-- carts                            +-- inventory_adjustments.performed_by
    +-- orders                           +-- transfers.created_by
```

### Product Hierarchy

```
Brand
  |
  +-- Products
        |
        +-- Images (1:N)
        +-- Variants/SKUs (1:N)
        |     |
        |     +-- Attribute Values (M:M)
        |     +-- Inventory Items (1:N)
        |     +-- Cart Items (1:N)
        |     +-- Order Items (1:N)
        |
        +-- Categories (M:M)
        +-- Files (1:N)
        +-- Meta (1:N)
```

### Inventory Flow

```
1. Purchase
   inventory_movements: movement_type='purchase'
   inventory_items.on_hand: +qty

2. Order Placed
   inventory_movements: movement_type='reservation'
   inventory_items.reserved: +qty

3. Order Fulfilled
   inventory_movements: movement_type='sale'
   inventory_items.on_hand: -qty
   
   inventory_movements: movement_type='release'
   inventory_items.reserved: -qty
```

### Order Flow

```
Cart (open)
  |
  +-- Cart Items
        |
        v
Cart (converted) ---> Order (pending)
                        |
                        +-- Order Items (snapshot)
                        +-- Payments (pending -> captured)
                        +-- Fulfillments (pending -> shipped -> delivered)
                              |
                              +-- Fulfillment Items
```

---

## CARDINALITY REFERENCE

| Relationship | Type | Description |
|-------------|------|-------------|
| Users → Addresses | 1:N | One user, many addresses |
| Users → Carts | 1:N | One user, many carts |
| Users → Orders | 1:N | One user, many orders |
| Administrators → Inventory Ops | 1:N | One admin, many operations |
| Brands → Products | 1:N | One brand, many products |
| Products → Variants | 1:N | One product, many SKUs |
| Products ↔ Categories | M:M | Many products in many categories |
| Variants → Inventory Items | 1:N | One SKU in many warehouses |
| Warehouses → Inventory Items | 1:N | One warehouse, many items |
| Orders → Order Items | 1:N | One order, many line items |
| Orders → Payments | 1:N | One order, multiple payments |
| Orders → Fulfillments | 1:N | One order, multiple shipments |
| Fulfillments → Fulfillment Items | 1:N | One shipment, many items |

---

## FOREIGN KEY CONSTRAINTS

### CASCADE (Child deleted with parent)
- Product → images, variants, categories, files, meta
- Order → items, payments, fulfillments
- Fulfillment → items
- Transfer → items
- Cart → items

### RESTRICT (Prevent deletion if children exist)
- Brand → products
- Category → products
- ProductVariant → cart_items, order_items

### SET NULL (Set FK to null on parent delete)
- User → addresses
- Address → orders (billing/shipping)
- Administrator → inventory operations

---

## TABLE COUNT BY DOMAIN

```
Total Tables: 32

1. Users & Admin (3)
   - users
   - administrators
   - addresses

2. Catalog (5)
   - brands
   - categories
   - products
   - product_categories
   - product_images

3. Attributes & Variants (5)
   - attributes
   - attribute_values
   - product_variants
   - variant_attribute_values
   - product_attribute_values

4. Inventory (6)
   - warehouses
   - inventory_items
   - inventory_movements
   - inventory_adjustments
   - transfers
   - transfer_items

5. Pricing (2)
   - price_lists
   - price_list_items

6. Orders & Payments (7)
   - carts
   - cart_items
   - orders
   - order_items
   - payments
   - fulfillments
   - fulfillment_items

7. Content (2)
   - product_files
   - product_meta

8. Laravel Default (3)
   - cache, cache_locks
   - jobs, job_batches, failed_jobs
   - sessions, password_reset_tokens
```

---

## DESIGN PATTERNS USED

### 1. Immutable Ledger
- **Table:** `inventory_movements`
- **Pattern:** Never edit, only append
- **Purpose:** Complete audit trail

### 2. Snapshot Pattern
- **Tables:** `order_items`, `cart_items`
- **Pattern:** Copy product data at transaction time
- **Purpose:** Historical data integrity

### 3. Soft Deletes
- **Tables:** `users`, `administrators`, `products`, `product_variants`
- **Pattern:** Mark as deleted, don't remove
- **Purpose:** Data recovery and audit trail

### 4. Separation of Concerns
- **Pattern:** Separate `users` (customers) from `administrators` (staff)
- **Purpose:** Clear role separation and security

### 5. Hierarchical Data
- **Table:** `categories`
- **Pattern:** Self-referencing with `parent_id` and `path`
- **Purpose:** Nested category structure

---

**Last Updated:** October 27, 2025  
**Version:** 2.0  
**Status:** Complete & Production Ready  
**Total Tables:** 32  
**Total Models:** 28
