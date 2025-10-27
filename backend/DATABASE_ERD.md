# Database Entity Relationship Diagram (ERD)

## Complete ERD for E-Commerce System (32 Tables)

---

## High-Level Entity Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER & ADMINISTRATION                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐                        ┌────────────────┐           │
│  │  Users   │ (Customers)       │  Administrators │ (Staff)    │
│  │          │                      │                 │           │
│  │ - email  │                      │ - email         │           │
│  │ - name   │                      │ - name          │           │
│  │ - phone  │                      │ - role          │           │
│  │          │                      │ - last_login    │           │
│  └──┬───────┘                      └──────┬───────────┘           │
│     │                                        │                      │
│     ├── addresses                           │                      │
│     ├── carts                                ├── inventory_movements│
│     └── orders                               ├── inventory_adjust. │
│                                              └── transfers         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          CATALOG SYSTEM                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────┐                                                       │
│  │ Brands  │                                                       │
│  └────┬────┘                                                       │
│       │                                                            │
│       │                                                            │
│  ┌────▼────────────────────────────────────────────┐             │
│  │              Products                            │             │
│  │  - name, slug, description                       │             │
│  │  - product_type (simple/variant/bundle)         │             │
│  │  - published_status, visibility                   │             │
│  │  - is_featured, is_active                        │             │
│  └────┬────────────────────────────┬───────────────┘             │
│       │                            │                              │
│       ├── categories (M:M)         ├── images                    │
│       │                            ├── variants                   │
│       │                            ├── files                      │
│       │                            └── meta                       │
│       │                                                            │
│       │                                                            │
│  ┌────▼──────────────────────┐                                    │
│  │       Categories          │                                    │
│  │  - hierarchical structure │                                    │
│  │  - parent_id              │                                    │
│  │  - path                   │                                    │
│  └───────────────────────────┘                                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     ATTRIBUTES & VARIANTS                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐                                                      │
│  │ Attributes│ (Color, Size, etc.)                                 │
│  └────┬─────┘                                                      │
│       │                                                            │
│       ├── values                                                   │
│       │   (Red, Blue, Large, Small)                               │
│       │                                                            │
│  ┌────▼──────────────┐                                            │
│  │ Attribute Values  │                                            │
│  └─────────┬─────────┘                                            │
│            │                                                       │
│            │                                                        │
│     ┌──────┴──────────┐                                            │
│     │                 │                                            │
│  ┌──▼────┐        ┌──▼──────────────────┐                        │
│  │Product │    │   │ Product Variants    │                        │
│  │(filter)│    │   │  - SKU, barcode     │                        │
│  │M:M pivot│   │   │  - price, cost      │                        │
│  └───────┘     │   │  - track_stock      │                        │
│                │   └────┬───────────────┘                        │
│                │        │                                        │
│                │        ├── variant_attribute_values             │
│                │        │   (links variants to attributes)       │
│                │        │                                        │
│                │        ├── inventory_items                       │
│                │        ├── cart_items                            │
│                │        ├── order_items                           │
│                │        └── price_list_items                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      INVENTORY SYSTEM                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────┐                                                     │
│  │ Warehouses│ (Physical locations)                                │
│  └────┬──────┘                                                     │
│       │                                                            │
│       │                                                            │
│  ┌────▼──────────────────────────────────────────────────┐        │
│  │                   Inventory Items                       │        │
│  │  Current stock per variant per warehouse               │        │
│  │  - on_hand (physical qty)                              │        │
│  │  - reserved (held for orders)                          │        │
│  │  - safety_stock, reorder_point                         │        │
│  └───────────────────────────────────────────────────────┘        │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │            Inventory Movements (LEDGER)                   │      │
│  │  Immutable audit trail of ALL stock changes              │      │
│  │  - purchase, sale, return, adjustment                    │      │
│  │  - transfer_in, transfer_out                             │      │
│  │  - reservation, release                                  │      │
│  │  - performed_by → Administrator                          │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │          Inventory Adjustments (Manual)                   │      │
│  │  - SET_ON_HAND or DELTA_ON_HAND                           │      │
│  │  - reason_code, note                                      │      │
│  │  - performed_by → Administrator                           │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ┌──────────┐        ┌──────────┐                                 │
│  │Transfers │───────▶│Transfer  │                                 │
│  │          │ items  │ Items    │                                 │
│  │ - status │        │          │                                 │
│  │ - created_by      │ - variant_id                               │
│  │   (Admin)         │ - qty                                     │
│  └──────────┘        └──────────┘                                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      ORDER SYSTEM                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐                                                      │
│  │   Carts  │                                                      │
│  │          │                                                      │
│  │ - status │                                                      │
│  │ - currency│                                                     │
│  └────┬─────┘                                                      │
│       │                                                            │
│       ├── cart_items                                               │
│       │    - variant_id                                            │
│       │    - qty, unit_price                                       │
│       │                                                            │
│       │                                                            │
│  ┌────▼──────────────────────────────────────────┐              │
│  │              Orders                            │              │
│  │  - order_number (unique)                       │              │
│  │  - status, totals                              │              │
│  │  - billing_address_id                           │              │
│  │  - shipping_address_id                          │              │
│  └──┬───────────────┬───────────────┬──────────┘              │
│     │               │               │                          │
│     │               │               │                          │
│  ┌──▼────┐    ┌─────▼────┐   ┌─────▼────────┐               │
│  │Order  │    │ Payments  │   │ Fulfillments │               │
│  │Items  │    │           │   │              │               │
│  │       │    │ - provider │   │ - tracking   │               │
│  │- snapshots│ │ - status  │   │ - carrier    │               │
│  │- qty/price│ │ - COD/... │   │ - status     │               │
│  └────────┘    └───────────┘   └──────┬───────┘               │
│                                        │                        │
│                                        └── fulfillment_items    │
│                                             (links to order_items)│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        PRICING (Optional)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────┐                                                     │
│  │Price Lists│                                                     │
│  │            │                                                     │
│  │ - name     │                                                     │
│  │ - currency │                                                     │
│  │ - dates    │                                                     │
│  └────┬───────┘                                                     │
│       │                                                             │
│       ├── price_list_items                                          │
│       │    - variant_id                                             │
│       │    - custom price                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Entity Relationships

### 1. User-Management Section

```
┌──────────────────────────────────────────────────────────┐
│  Users (Customers)                  Administrators (Staff) │
│  ├── id (PK)                        ├── id (PK)          │
│  ├── email (unique)                 ├── email (unique)    │
│  ├── first_name                     ├── first_name       │
│  ├── last_name                      ├── last_name        │
│  ├── is_active                      ├── role             │
│  └── soft_deletes                   ├── is_active        │
│                                      └── soft_deletes     │
│                                                           │
│  ┌────────────────────────────────────┐                 │
│  │        Addresses                   │                 │
│  │  ├── user_id (FK → Users)          │                 │
│  │  ├── name, contact, phone          │                 │
│  │  ├── line1, line2, city            │                 │
│  │  ├── country_code                  │                 │
│  │  └── is_default_billing/shipping   │                 │
│  └────────────────────────────────────┘                 │
│                                                           │
│  ┌──────────────────────────┐  ┌──────────────────┐    │
│  │       Orders             │  │ Inventory Op.    │    │
│  │  ├── user_id (FK)        │  │ performed_by     │    │
│  │  ├── billing_address_id  │  │ (FK → Admin)     │    │
│  │  ├── shipping_address_id │  └──────────────────┘    │
│  │  └── totals              │                          │
│  └──────────────────────────┘                          │
└──────────────────────────────────────────────────────────┘
```

---

### 2. Catalog & Product Section

```
┌───────────────────────────────────────────────────────────┐
│  Brands                                                    │
│  ├── id                                                    │
│  ├── name, slug                                           │
│  └── website_url, logo_url                               │
│                                                            │
│       │                                                    │
│       │ 1:N                                                │
│       ▼                                                    │
│  ┌───────────────────────────────────────────────┐       │
│  │  Products                                       │       │
│  │  ├── id                                         │       │
│  │  ├── name, slug, description                  │       │
│  │  ├── brand_id (FK)                             │       │
│  │  ├── product_type (simple/variant/bundle)     │       │
│  │  ├── published_status, visibility             │       │
│  │  ├── is_featured, is_active                   │       │
│  │  └── dimensions, weight, SEO fields           │       │
│  └──┬──────────┬──────────┬──────────┬────────┘       │
│     │          │          │          │                 │
│     │ 1:N      │ 1:N      │ M:M      │ 1:N            │
│     │          │          │          │                 │
│     ▼          ▼          ▼          ▼                 │
│  ┌────┐   ┌────────┐  ┌────────┐  ┌────────┐          │
│  │Imgs│   │Variants│  │Categories│ │Files, │          │
│  │    │   │        │  │         │ │Meta   │          │
│  └────┘   └────┬───┘  └────────┘  └────────┘          │
│                │                                       │
│                │ 1:N                                  │
│                ▼                                      │
│         ┌─────────────┐                              │
│         │ Categories  │ (Hierarchical)               │
│         │ - parent_id │                              │
│         │ - path      │                              │
│         └─────────────┘                              │
└───────────────────────────────────────────────────────────┘
```

---

### 3. Attributes & Variants Section

```
┌────────────────────────────────────────────────────────────┐
│  Attributes                          Attribute Values      │
│  ├── name (Color)          1:N      ├── attribute_id (FK) │
│  ├── slug                            ├── value (Red)      │
│  └── position                        └── value_key (#FF0000)│
│                                                             │
│                        Product Variants                     │
│                       ├── product_id (FK)                  │
│                       ├── SKU (unique)                     │
│                       ├── barcode (unique)                │
│                       ├── price, compare_at, cost         │
│                       ├── track_stock, allow_backorder     │
│                       ├── dimensions (override)            │
│                       └── status                           │
│                                                             │
│       M:M (via variant_attribute_values)                   │
│       ┌──────────────────────────────────────┐           │
│       │ Variant Attribute Values (Pivot)      │           │
│       │ - variant_id (FK)                     │           │
│       │ - attribute_id (FK)                   │           │
│       │ - attribute_value_id (FK)             │           │
│       │ PK: (variant_id, attribute_id)        │           │
│       └──────────────────────────────────────┘           │
│                                                             │
│       One variant can have:                                │
│       - Color: Red + Size: Large                           │
│       - Color: Blue + Size: Small                          │
│                                                             │
│       Same attributes, different value combinations =      │
│       different variants                                    │
└────────────────────────────────────────────────────────────┘
```

---

### 4. Inventory Management Section

```
┌──────────────────────────────────────────────────────────┐
│  Warehouses                                               │
│  ├── code (unique)                                        │
│  ├── name                                                 │
│  └── address details                                      │
│                                                            │
│       │ 1:N                                                │
│       ▼                                                    │
│  ┌────────────────────────────────────┐                 │
│  │   Inventory Items (Current Stock)  │                 │
│  │   ├── variant_id (FK)              │                 │
│  │   ├── warehouse_id (FK)             │                 │
│  │   ├── on_hand (physical qty)        │                 │
│  │   ├── reserved (held for orders)    │                 │
│  │   ├── safety_stock                   │                 │
│  │   └── reorder_point                  │                 │
│  │                                      │                 │
│  │   available = on_hand - reserved     │                 │
│  └────────────────────────────────────┘                 │
│                                                            │
│  ┌────────────────────────────────────────────────┐     │
│  │     Inventory Movements (LEDGER - Immutable)    │     │
│  │   ├── variant_id (FK)                          │     │
│  │   ├── warehouse_id (FK)                        │     │
│  │   ├── qty_change (signed: + or -)              │     │
│  │   ├── movement_type (sale, purchase, etc.)     │     │
│  │   ├── reference_type, reference_id             │     │
│  │   ├── unit_cost (for COGS)                     │     │
│  │   ├── performed_by → Administrator (FK) ✅     │     │
│  │   └── performed_at, created_at                 │     │
│  └────────────────────────────────────────────────┘     │
│                                                            │
│  ┌────────────────────────────────────────────────┐     │
│  │  Inventory Adjustments (Manual Corrections)    │     │
│  │   ├── adjustment_mode (SET or DELTA)           │     │
│  │   ├── qty_before, qty_change, qty_after        │     │
│  │   ├── reason_code                              │     │
│  │   ├── performed_by → Administrator (FK) ✅     │     │
│  │   └── triggers inventory_movements record      │     │
│  └────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Transfers (Between Warehouses)                          │
│  ├── from_warehouse_id (FK)                             │
│  ├── to_warehouse_id (FK)                               │
│  ├── status (draft, in_transit, received, canceled)    │
│  ├── created_by → Administrator (FK) ✅                 │
│  │                                                        │
│  │ 1:N                                                    │
│  └── transfer_items                                       │
│       ├── variant_id (FK)                                │
│       └── qty                                             │
└──────────────────────────────────────────────────────────┘
```

---

### 5. Order Flow Section

```
┌─────────────────────────────────────────────────────────┐
│  Carts (Shopping Sessions)                               │
│  ├── user_id (FK → Users)                                │
│  ├── currency                                            │
│  ├── status (open, converted, abandoned)                │
│  │                                                        │
│  │ 1:N                                                    │
│  └── cart_items                                          │
│       ├── variant_id (FK)                                │
│       ├── qty                                            │
│       └── unit_price (snapshot)                           │
└─────────────────────────────────────────────────────────┘
                                    │
                                    │ Converted
                                    ▼
┌─────────────────────────────────────────────────────────┐
│  Orders                                                  │
│  ├── user_id (FK → Users)                                │
│  ├── order_number (unique)                               │
│  ├── status (pending → paid → fulfilled → delivered)    │
│  ├── subtotal, discount, shipping, tax, grand_total     │
│  ├── billing_address_id (FK → Addresses)                │
│  ├── shipping_address_id (FK → Addresses)               │
│  ├── placed_at                                           │
│  │                                                        │
│  │ 1:N     1:N      1:N                                  │
│  ├── order_items ─── payments ─── fulfillments           │
│  │                                                         │
│  └── order_items (Snapshot at order time)                │
│       ├── variant_id (FK)                                │
│       ├── product_name (snapshot)                        │
│       ├── variant_sku (snapshot)                          │
│       ├── qty, unit_price, totals                        │
│       │                                                    │
│       │ 1:N                                               │
│       └── fulfillment_items (partial shipment support)   │
│                                                          │
└─────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                            ┌──────────────────┐
                            │   Payments       │
                            │                  │
                            │ - provider (COD, │
                            │   bKash, etc.)   │
                            │ - status         │
                            │ - paid_at        │
                            └──────────────────┘
                                    │
                                    ▼
                            ┌──────────────────┐
                            │   Fulfillments   │
                            │                  │
                            │ - tracking_num   │
                            │ - carrier        │
                            │ - status         │
                            │ - shipped_at     │
                            └──────────────────┘
```

---

## Key Entity Patterns

### 1. Separation of Concerns

```
┌──────────┐         ┌──────────────┐
│  Users   │         │Administrators│
│ (Customers)        │   (Staff)     │
└────┬─────┘         └──────┬───────┘
     │                       │
     ├── addresses            ├── inventory_movements.performed_by
     ├── carts               ├── inventory_adjustments.performed_by
     └── orders              └── transfers.created_by
```

### 2. Product Structure

```
Product
  │
  ├── Many: Images
  ├── Many: Variants (SKUs)
  │         │
  │         ├── Many: Inventory Items (per warehouse)
  │         ├── Many: Attribute Values
  │         └── Used in: Cart Items, Order Items
  │
  ├── Many: Categories (many-to-many)
  ├── Many: Files (downloadables)
  └── Many: Meta (key-value)
```

### 3. Inventory Flow

```
Purchase
  ↓
inventory_movements (movement_type='purchase')
  ↓
inventory_items.on_hand: +qty

Order Placed
  ↓
inventory_movements (movement_type='reservation')
  ↓
inventory_items.reserved: +qty

Order Fulfilled
  ↓
inventory_movements (movement_type='sale')
  ↓
inventory_items.on_hand: -qty
inventory_items.reserved: -qty (via release movement)
```

---

## Cardinality Summary

| Relationship | Type | Description |
|-------------|------|-------------|
| Users → Addresses | 1:N | One user, many addresses |
| Users → Carts | 1:N | One user, many carts |
| Users → Orders | 1:N | One user, many orders |
| Administrators → Movements | 1:N | One admin, many inventory operations |
| Products → Variants | 1:N | One product, many variants |
| Variants → Inventory Items | 1:N | One variant, many locations |
| Products ↔ Categories | M:M | Many-to-many via pivot |
| Products → Images | 1:N | One product, many images |
| Orders → Order Items | 1:N | One order, many items |
| Orders → Payments | 1:N | One order, many payments |
| Orders → Fulfillments | 1:N | One order, many shipments |
| Fulfillments → Fulfillment Items | 1:N | One fulfillment, many items |

---

## Database Visual Summary

```
Total Tables: 32
├── Users & Admin (3): users, administrators, addresses
├── Catalog (5): brands, categories, products, product_categories, product_images
├── Attributes (5): attributes, attribute_values, product_variants, 
│    variant_attribute_values, product_attribute_values
├── Inventory (6): warehouses, inventory_items, inventory_movements,
│    inventory_adjustments, transfers, transfer_items
├── Pricing (2): price_lists, price_list_items
├── Orders (7): carts, cart_items, orders, order_items, 
│    payments, fulfillments, fulfillment_items
└── Content (2): product_files, product_meta
```

---

**Last Updated:** October 27, 2025  
**Version:** 1.0  
**Status:** Complete & Production Ready

