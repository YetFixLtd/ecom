# Model Relationships Quick Reference

This document provides a visual overview of all model relationships in the e-commerce system.

## Relationship Legend
- `→` = belongsTo (many-to-one)
- `←` = hasMany (one-to-many)
- `↔` = belongsToMany (many-to-many)
- `⊙` = hasOne (one-to-one)

## 1. User & Address Relationships

```
User
  ← addresses (Address)
  ⊙ defaultBillingAddress (Address where is_default_billing = true)
  ⊙ defaultShippingAddress (Address where is_default_shipping = true)
  ← carts (Cart)
  ← orders (Order)

Address
  → user (User)
  ← ordersAsBillingAddress (Order via billing_address_id)
  ← ordersAsShippingAddress (Order via shipping_address_id)
```

## 2. Catalog Relationships

```
Brand
  ← products (Product)

Category
  → parent (Category - self-referential)
  ← children (Category - self-referential)
  ↔ products (Product via product_categories)

Product
  → brand (Brand)
  ↔ categories (Category via product_categories)
  ← images (ProductImage)
  ⊙ primaryImage (ProductImage where is_primary = true)
  ← variants (ProductVariant)
  ↔ attributeValues (AttributeValue via product_attribute_values)
  ← files (ProductFile)
  ← meta (ProductMeta)

ProductImage
  → product (Product)
```

## 3. Attribute & Variant Relationships

```
Attribute
  ← values (AttributeValue)
  ← variantAttributeValues (VariantAttributeValue)

AttributeValue
  → attribute (Attribute)
  ↔ products (Product via product_attribute_values)
  ← variantAttributeValues (VariantAttributeValue)

ProductVariant
  → product (Product)
  ← attributeValues (VariantAttributeValue)
  ← inventoryItems (InventoryItem)
  ← inventoryMovements (InventoryMovement)
  ← priceListItems (PriceListItem)
  ← cartItems (CartItem)
  ← orderItems (OrderItem)
  ← transferItems (TransferItem)

VariantAttributeValue (Pivot Model)
  → variant (ProductVariant)
  → attribute (Attribute)
  → attributeValue (AttributeValue)
```

## 4. Inventory Relationships

```
Warehouse
  ← inventoryItems (InventoryItem)
  ← inventoryMovements (InventoryMovement)
  ← inventoryAdjustments (InventoryAdjustment)
  ← transfersFrom (Transfer via from_warehouse_id)
  ← transfersTo (Transfer via to_warehouse_id)

InventoryItem
  → variant (ProductVariant)
  → warehouse (Warehouse)

InventoryMovement
  → variant (ProductVariant)
  → warehouse (Warehouse)
  → performedBy (User)

InventoryAdjustment
  → variant (ProductVariant)
  → warehouse (Warehouse)
  → performedBy (User)

Transfer
  → fromWarehouse (Warehouse)
  → toWarehouse (Warehouse)
  → createdBy (User)
  ← items (TransferItem)

TransferItem
  → transfer (Transfer)
  → variant (ProductVariant)
```

## 5. Pricing Relationships

```
PriceList
  ← items (PriceListItem)

PriceListItem
  → priceList (PriceList)
  → variant (ProductVariant)
```

## 6. Order Relationships

```
Cart
  → user (User)
  ← items (CartItem)

CartItem
  → cart (Cart)
  → variant (ProductVariant)

Order
  → user (User)
  → billingAddress (Address)
  → shippingAddress (Address)
  ← items (OrderItem)
  ← payments (Payment)
  ← fulfillments (Fulfillment)

OrderItem
  → order (Order)
  → variant (ProductVariant)
  ← fulfillmentItems (FulfillmentItem)

Payment
  → order (Order)

Fulfillment
  → order (Order)
  ← items (FulfillmentItem)

FulfillmentItem
  → fulfillment (Fulfillment)
  → orderItem (OrderItem)
```

## 7. Content Relationships

```
ProductFile
  → product (Product)

ProductMeta
  → product (Product)
```

## Complete Relationship Map

```
                                    ┌─────────────┐
                                    │    User     │
                                    └──────┬──────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
              ┌──────────┐           ┌─────────┐           ┌─────────┐
              │ Address  │           │  Cart   │           │  Order  │
              └────┬─────┘           └────┬────┘           └────┬────┘
                   │                      │                     │
                   │                  ┌───┴────┐           ┌────┼────┐
                   │                  ▼        │           │    │    │
                   │            ┌──────────┐   │           ▼    ▼    ▼
                   │            │CartItem  │   │      ┌────────┬──────┬─────────┐
                   │            └────┬─────┘   │      │OrderIt.│Paymnt│Fulfill. │
                   │                 │         │      └────┬───┴──────┴────┬────┘
                   │                 │         │           │                │
                   └─────────────────┼─────────┘           │                ▼
                                     │                     │         ┌──────────────┐
                                     ▼                     │         │FulfillmentIt.│
                              ┌─────────────┐             │         └──────────────┘
                              │   Variant   │◄────────────┘
                              └──────┬──────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
    ┌─────────┐              ┌─────────────┐           ┌──────────────┐
    │Inventory│              │ VariantAttr │           │ PriceListIt. │
    │  Item   │              │    Value    │           └──────────────┘
    └─────────┘              └──────┬──────┘
         │                          │
         ▼                          ▼
    ┌─────────┐              ┌─────────────┐
    │Warehouse│              │AttributeVal.│
    └─────────┘              └──────┬──────┘
                                    │
                                    ▼
                              ┌──────────┐
                              │Attribute │
                              └──────────┘

    ┌─────────┐         ┌──────────┐         ┌──────────┐
    │  Brand  │◄────────┤ Product  │────────►│ Category │
    └─────────┘         └────┬─────┘         └────┬─────┘
                             │                    │
                    ┌────────┼────────┐           │ (self-ref)
                    │        │        │           │
                    ▼        ▼        ▼           ▼
              ┌────────┬────────┬────────┐  ┌─────────┐
              │Product │Product │Product │  │ Parent  │
              │ Image  │  File  │  Meta  │  │Category │
              └────────┴────────┴────────┘  └─────────┘
```

## Cascade Delete Rules

### CASCADE (child data deleted with parent)
- Product → ProductImage
- Product → ProductVariant
- Product → ProductFile
- Product → ProductMeta
- Product → product_categories (pivot)
- Attribute → AttributeValue
- Category → category (self-referential parent)
- ProductVariant → variant_attribute_values (pivot)
- Cart → CartItem
- Order → OrderItem
- Order → Payment
- Order → Fulfillment
- Fulfillment → FulfillmentItem
- Warehouse → InventoryItem
- Transfer → TransferItem
- PriceList → PriceListItem

### RESTRICT (prevents deletion if children exist)
- Brand → Product (cannot delete brand if products exist)
- Category → product_categories (cannot delete category if products linked)
- ProductVariant → CartItem (cannot delete variant if in carts)
- ProductVariant → OrderItem (cannot delete variant if in orders)
- Warehouse → Transfer (cannot delete warehouse if transfers exist)

### SET NULL (foreign key set to null on parent delete)
- User → Address (addresses persist without user)
- Brand → Product (products persist without brand)
- Category → Category parent (categories persist without parent)

## Common Query Patterns

### Get Product with All Related Data
```php
Product::with([
    'brand',
    'categories',
    'images',
    'variants.attributeValues.attribute',
    'variants.attributeValues.attributeValue',
    'meta',
    'files'
])->find($productId);
```

### Get Variant with Inventory
```php
ProductVariant::with([
    'product',
    'inventoryItems.warehouse',
    'attributeValues.attribute',
    'attributeValues.attributeValue'
])->find($variantId);
```

### Get Order with Complete Details
```php
Order::with([
    'user',
    'billingAddress',
    'shippingAddress',
    'items.variant.product',
    'payments',
    'fulfillments.items.orderItem'
])->find($orderId);
```

### Get Inventory Movements with References
```php
InventoryMovement::with([
    'variant.product',
    'warehouse',
    'performedBy'
])
->where('variant_id', $variantId)
->orderBy('performed_at', 'desc')
->get();
```

### Get Categories with Products
```php
Category::with([
    'products.brand',
    'products.primaryImage',
    'children'
])->whereNull('parent_id')->get();
```

## Performance Tips

1. **Eager Loading**: Always use `with()` to avoid N+1 query problems
2. **Select Specific Columns**: Use `select()` to load only needed fields
3. **Pagination**: Use `paginate()` for large datasets
4. **Indexing**: Ensure foreign keys and frequently queried columns are indexed
5. **Chunk Processing**: Use `chunk()` for processing large datasets
6. **Query Scopes**: Create reusable query scopes in models

## Example Scopes

Add these to your models for reusable queries:

```php
// In Product model
public function scopePublished($query)
{
    return $query->where('published_status', 'published')
                 ->where('is_active', true);
}

// In ProductVariant model
public function scopeActive($query)
{
    return $query->where('status', 'active');
}

// In Order model
public function scopePending($query)
{
    return $query->where('status', 'pending');
}

// Usage:
$products = Product::published()->with('variants')->get();
$variants = ProductVariant::active()->get();
$orders = Order::pending()->with('items')->get();
```

