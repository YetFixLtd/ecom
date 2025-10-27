# Model Relationships Quick Reference

## Model Count: 28

**Organized by Domain:**
- User/Admin: 2 models (User, Administrator)
- Catalog: 4 models (Brand, Category, Product, ProductImage)
- Attributes: 4 models (Attribute, AttributeValue, ProductVariant, VariantAttributeValue)
- Inventory: 6 models (Warehouse, InventoryItem, InventoryMovement, InventoryAdjustment, Transfer, TransferItem)
- Pricing: 2 models (PriceList, PriceListItem)
- Orders: 7 models (Cart, CartItem, Order, OrderItem, Payment, Fulfillment, FulfillmentItem)
- Content: 2 models (ProductFile, ProductMeta)
- User Address: 1 model (Address)

---

## Visual Relationship Map

```
┌─────────────────────────────────────────────────────────────┐
│                      USER MANAGEMENT                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐                                              │
│  │   User   │ (Customers)                                  │
│  │  (users) │                                              │
│  └────┬─────┘                                              │
│       │                                                     │
│       ├── addresses                                         │
│       ├── carts                                             │
│       └── orders                                            │
│                                                             │
│  ┌──────────────┐                                           │
│  │Administrator│ (Staff/Admins)                            │
│  │(administrator│                                           │
│  └─────┬───────┘                                           │
│        │                                                     │
│        ├── inventory_movements.performed_by                 │
│        ├── inventory_adjustments.performed_by               │
│        └── transfers.created_by                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      CATALOG MANAGEMENT                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────┐           ┌────────────┐                      │
│  │ Brand  │           │  Category  │                      │
│  └───┬────┘           └──────┬─────┘                      │
│      │                        │                            │
│      │                        ├──┬──────┐                  │
│      │                        │Parent │ Children           │
│      │                        └──┴──────┘                  │
│      │                        │                            │
│      └──────────┬─────────────┘                            │
│                 ▼                                          │
│              ┌─────────┐                                    │
│              │ Product │                                    │
│              └────┬────┘                                    │
│                   │                                         │
│         ┌─────────┼─────────┐                             │
│         │         │         │                             │
│         ▼         ▼         ▼                             │
│    ┌────────┐ ┌─────────┐ ┌──────────┐                   │
│    │ Image  │ │ Product │ │  Variant │                   │
│    │        │ │   File  │ │ (SKU)    │                   │
│    └────────┘ └─────────┘ └────┬─────┘                   │
│                                │                          │
│                                ├── inventory_items        │
│                                ├── cart_items            │
│                                ├── order_items           │
│                                └── price_list_items      │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    INVENTORY MANAGEMENT                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐                                              │
│  │Warehouse │                                              │
│  └────┬─────┘                                              │
│       │                                                     │
│       ├── inventory_items                                   │
│       ├── inventory_movements                              │
│       ├── inventory_adjustments                            │
│       ├── transfers.from_warehouse_id                      │
│       └── transfers.to_warehouse_id                        │
│                                                             │
│  inventory_items                                            │
│    ├── variant_id ──────────┐                             │
│    └── warehouse_id ────────┤                             │
│                              │                             │
│  inventory_movements (LEDGER)                               │
│    ├── variant_id ──────────┐                             │
│    ├── warehouse_id ─────────┤                             │
│    └── performed_by ────────▶ Administrator               │
│                                                             │
│  transfers                                                  │
│    ├── from_warehouse_id                                    │
│    ├── to_warehouse_id                                      │
│    ├── created_by ─────────▶ Administrator                │
│    └── items                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete Model List

### 1. User Management (3 models)

**User** (`App\Models\User`)
- Belongs to: None
- Has many: `addresses`, `carts`, `orders`
- Soft deletes: Yes
- Purpose: Customer accounts

**Administrator** (`App\Models\Administrator`)
- Belongs to: None
- Has many: None (referenced by others)
- Soft deletes: Yes
- Purpose: Staff/admin accounts

**Address** (`App\Models\User\Address`)
- Belongs to: `user`
- Has many: `ordersAsBillingAddress`, `ordersAsShippingAddress`
- Soft deletes: No
- Purpose: User shipping/billing addresses

---

### 2. Catalog (4 models)

**Brand** (`App\Models\Catalog\Brand`)
- Belongs to: None
- Has many: `products`

**Category** (`App\Models\Catalog\Category`)
- Belongs to: `parent` (self-reference)
- Has many: `children` (self-reference), `products` (many-to-many)
- Purpose: Hierarchical categories

**Product** (`App\Models\Catalog\Product`)
- Belongs to: `brand`, `categories` (many-to-many)
- Has many: `categories` (many-to-many), `images`, `variants`, `attributeValues` (many-to-many), `files`, `meta`
- Soft deletes: Yes

**ProductImage** (`App\Models\Catalog\ProductImage`)
- Belongs to: `product`
- Purpose: Product images

---

### 3. Attributes & Variants (4 models)

**Attribute** (`App\Models\Attribute\Attribute`)
- Belongs to: None
- Has many: `values`, `variantAttributeValues`
- Purpose: Product attributes (Color, Size, etc.)

**AttributeValue** (`App\Models\Attribute\AttributeValue`)
- Belongs to: `attribute`
- Has many: `products` (many-to-many), `variantAttributeValues`
- Purpose: Attribute values (Red, Large, etc.)

**ProductVariant** (`App\Models\Attribute\ProductVariant`)
- Belongs to: `product`
- Has many: `attributeValues`, `inventoryItems`, `inventoryMovements`, `priceListItems`, `cartItems`, `orderItems`
- Soft deletes: Yes
- Purpose: SKU-level variations

**VariantAttributeValue** (`App\Models\Attribute\VariantAttributeValue`)
- Belongs to: `variant`, `attribute`, `attributeValue`
- Purpose: Pivot table for variant attributes

---

### 4. Inventory (6 models)

**Warehouse** (`App\Models\Inventory\Warehouse`)
- Belongs to: None
- Has many: `inventoryItems`, `inventoryMovements`, `inventoryAdjustments`, `transfersFrom`, `transfersTo`

**InventoryItem** (`App\Models\Inventory\InventoryItem`)
- Belongs to: `variant`, `warehouse`
- Computed: `available` attribute (on_hand - reserved)
- Methods: `isBelowSafetyStock()`, `needsReorder()`

**InventoryMovement** (`App\Models\Inventory\InventoryMovement`)
- Belongs to: `variant`, `warehouse`, `performedBy` (Administrator)
- Methods: `isIncoming()`, `isOutgoing()`
- Purpose: Immutable audit trail

**InventoryAdjustment** (`App\Models\Inventory\InventoryAdjustment`)
- Belongs to: `variant`, `warehouse`, `performedBy` (Administrator)
- Purpose: Manual stock corrections

**Transfer** (`App\Models\Inventory\Transfer`)
- Belongs to: `fromWarehouse`, `toWarehouse`, `createdBy` (Administrator)
- Has many: `items`
- Methods: `isDraft()`, `isInTransit()`, `isReceived()`, `isCanceled()`

**TransferItem** (`App\Models\Inventory\TransferItem`)
- Belongs to: `transfer`, `variant`

---

### 5. Pricing (2 models)

**PriceList** (`App\Models\Pricing\PriceList`)
- Belongs to: None
- Has many: `items`
- Purpose: Custom pricing schedules

**PriceListItem** (`App\Models\Pricing\PriceListItem`)
- Belongs to: `priceList`, `variant`
- Purpose: Variant-specific prices

---

### 6. Orders (7 models)

**Cart** (`App\Models\Order\Cart`)
- Belongs to: `user`
- Has many: `items`
- Methods: `isOpen()`, `isConverted()`, `isAbandoned()`
- Computed: `subtotal`

**CartItem** (`App\Models\Order\CartItem`)
- Belongs to: `cart`, `variant`
- Computed: `lineTotal`

**Order** (`App\Models\Order\Order`)
- Belongs to: `user`, `billingAddress`, `shippingAddress`
- Has many: `items`, `payments`, `fulfillments`
- Methods: `isPending()`, `isPaid()`, `isFulfilled()`, `isCanceled()`, `isRefunded()`

**OrderItem** (`App\Models\Order\OrderItem`)
- Belongs to: `order`, `variant`
- Has many: `fulfillmentItems`
- Purpose: Snapshots product data at order time

**Payment** (`App\Models\Order\Payment`)
- Belongs to: `order`
- Methods: `isPending()`, `isAuthorized()`, `isCaptured()`, `isFailed()`, `isRefunded()`, `isCashOnDelivery()`, `isOnlinePayment()`
- Computed: `getProviderDisplayName()`

**Fulfillment** (`App\Models\Order\Fulfillment`)
- Belongs to: `order`
- Has many: `items`
- Methods: `isPending()`, `isPacked()`, `isShipped()`, `isDelivered()`, `isCanceled()`

**FulfillmentItem** (`App\Models\Order\FulfillmentItem`)
- Belongs to: `fulfillment`, `orderItem`
- Purpose: Links order items to shipments (partial fulfillment support)

---

### 7. Content (2 models)

**ProductFile** (`App\Models\Content\ProductFile`)
- Belongs to: `product`
- Purpose: Downloadable files (manuals, certificates)

**ProductMeta** (`App\Models\Content\ProductMeta`)
- Belongs to: `product`
- Purpose: Custom key-value metadata

---

## Key Design Patterns

### 1. Immutable Ledger (inventory_movements)
- **Never edit** existing movements
- Always create **compensating entries**
- Complete audit trail for all stock changes

### 2. Snapshot Pattern (order_items, cart_items)
- Capture product details at order time
- Prevent data changes from affecting historical orders
- Fields: `product_name`, `variant_sku`, `unit_price`

### 3. Soft Deletes
- **Users** (customers): Soft deletes
- **Administrators** (staff): Soft deletes  
- **Products**: Soft deletes
- **ProductVariants**: Soft deletes

### 4. Role-Based Separation
- **Users**: Customer operations only
- **Administrators**: Staff operations only
- Clear separation via different tables and relationships

---

## Foreign Key Summary

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

### SET NULL (Set foreign key to null on parent delete)
- User → addresses
- Address → orders (billing/shipping)
- Administrator → inventory operations

---

## Usage Examples

### Get Product with All Relations
```php
$product = Product::with([
    'brand',
    'categories',
    'images',
    'variants.attributeValues.attribute',
    'variants.attributeValues.attributeValue',
    'meta',
    'files'
])->find($productId);
```

### Check Inventory by Admin
```php
$movement = InventoryMovement::with(['performedBy'])
    ->find($movementId);

echo $movement->performedBy->full_name;  // Admin who did it
```

### Get Order with All Details
```php
$order = Order::with([
    'user',
    'billingAddress',
    'shippingAddress',
    'items.variant.product',
    'payments',
    'fulfillments.items.orderItem'
])->find($orderId);
```

### Track Inventory Changes
```php
$movements = InventoryMovement::with([
    'variant.product',
    'warehouse',
    'performedBy'  // Administrator
])
->where('variant_id', $variantId)
->orderBy('performed_at', 'desc')
->get();
```

---

## Key Business Rules

1. **Published products** must have at least one active variant
2. **Available stock** = `on_hand - reserved` (must not drop below zero unless `allow_backorder=true`)
3. **All inventory changes** create an `inventory_movements` record
4. **Never edit movements** - create compensating entries
5. **Order items snapshot** product data at order time
6. **Only administrators** can perform inventory operations

---

**Last Updated:** October 27, 2025  
**Status:** Complete & Production Ready  
**Total Models:** 28  
**Total Tables:** 32

