# Database Schema

## Overview
This document describes the database structure for the e-commerce application.

## Entity Relationship Diagram (ERD)

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    Users     │         │   Products   │         │  Categories  │
├──────────────┤         ├──────────────┤         ├──────────────┤
│ id           │         │ id           │         │ id           │
│ name         │         │ name         │         │ name         │
│ email        │         │ slug         │         │ slug         │
│ password     │         │ description  │         │ description  │
│ role         │         │ price        │         │ image        │
│ created_at   │         │ sale_price   │         │ parent_id    │
│ updated_at   │         │ stock        │         │ created_at   │
└──────────────┘         │ sku          │         │ updated_at   │
                         │ category_id ─┼────────▶│ id           │
                         │ created_at   │         └──────────────┘
                         │ updated_at   │
                         └──────────────┘
                                │
                                │
                    ┌───────────┴───────────┐
                    │                       │
             ┌──────▼──────┐         ┌──────▼──────┐
             │   Images    │         │  Attributes │
             ├─────────────┤         ├─────────────┤
             │ id          │         │ id          │
             │ product_id  │         │ product_id  │
             │ url         │         │ name        │
             │ is_primary  │         │ value       │
             │ created_at  │         │ created_at  │
             │ updated_at  │         │ updated_at  │
             └─────────────┘         └─────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│     Cart     │         │    Orders    │         │ Order Items  │
├──────────────┤         ├──────────────┤         ├──────────────┤
│ id           │         │ id           │         │ id           │
│ user_id     ─┼────┐    │ user_id     ─┼────┐    │ order_id    ─┼───┐
│ product_id  ─┼───┐│    │ order_number │    │    │ product_id  ─┼──┐│
│ quantity     │   ││    │ status       │    │    │ quantity     │  ││
│ created_at   │   ││    │ subtotal     │    │    │ price        │  ││
│ updated_at   │   ││    │ tax          │    │    │ created_at   │  ││
└──────────────┘   ││    │ shipping     │    │    │ updated_at   │  ││
                   ││    │ total        │    │    └──────────────┘  ││
                   ││    │ created_at   │    │                      ││
                   ││    │ updated_at   │    │                      ││
                   ││    └──────────────┘    │                      ││
                   ││                        │                      ││
                   │└────────────────────────┘                      ││
                   └────────────────────────────────────────────────┘
```

---

## Tables

### users
Stores user account information.

| Column         | Type          | Constraints                      | Description                    |
|----------------|---------------|----------------------------------|--------------------------------|
| id             | bigint        | PRIMARY KEY, AUTO_INCREMENT      | Unique user identifier         |
| name           | varchar(255)  | NOT NULL                         | User's full name              |
| email          | varchar(255)  | UNIQUE, NOT NULL                 | User's email address          |
| email_verified_at | timestamp | NULLABLE                         | Email verification timestamp   |
| password       | varchar(255)  | NOT NULL                         | Hashed password               |
| role           | enum          | DEFAULT 'customer'               | user role (customer, admin)   |
| remember_token | varchar(100)  | NULLABLE                         | Remember me token             |
| created_at     | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record creation timestamp      |
| updated_at     | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record update timestamp        |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`

---

### categories
Stores product categories (supports nested categories).

| Column      | Type          | Constraints                      | Description                    |
|-------------|---------------|----------------------------------|--------------------------------|
| id          | bigint        | PRIMARY KEY, AUTO_INCREMENT      | Unique category identifier     |
| name        | varchar(255)  | NOT NULL                         | Category name                  |
| slug        | varchar(255)  | UNIQUE, NOT NULL                 | URL-friendly identifier        |
| description | text          | NULLABLE                         | Category description           |
| image       | varchar(255)  | NULLABLE                         | Category image path            |
| parent_id   | bigint        | FOREIGN KEY, NULLABLE            | Parent category (for nesting)  |
| created_at  | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record creation timestamp      |
| updated_at  | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record update timestamp        |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `slug`
- INDEX on `parent_id`

**Foreign Keys:**
- `parent_id` REFERENCES `categories(id)` ON DELETE CASCADE

---

### products
Stores product information.

| Column       | Type          | Constraints                      | Description                    |
|--------------|---------------|----------------------------------|--------------------------------|
| id           | bigint        | PRIMARY KEY, AUTO_INCREMENT      | Unique product identifier      |
| name         | varchar(255)  | NOT NULL                         | Product name                   |
| slug         | varchar(255)  | UNIQUE, NOT NULL                 | URL-friendly identifier        |
| description  | text          | NOT NULL                         | Product description            |
| price        | decimal(10,2) | NOT NULL                         | Regular price                  |
| sale_price   | decimal(10,2) | NULLABLE                         | Discounted price               |
| stock        | integer       | DEFAULT 0                        | Available quantity             |
| sku          | varchar(100)  | UNIQUE, NOT NULL                 | Stock keeping unit             |
| category_id  | bigint        | FOREIGN KEY, NOT NULL            | Related category               |
| is_featured  | boolean       | DEFAULT false                    | Featured product flag          |
| is_active    | boolean       | DEFAULT true                     | Product availability flag      |
| created_at   | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record creation timestamp      |
| updated_at   | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record update timestamp        |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `slug`
- UNIQUE INDEX on `sku`
- INDEX on `category_id`
- INDEX on `is_featured`
- INDEX on `is_active`

**Foreign Keys:**
- `category_id` REFERENCES `categories(id)` ON DELETE RESTRICT

---

### product_images
Stores product images (one-to-many relationship with products).

| Column      | Type          | Constraints                      | Description                    |
|-------------|---------------|----------------------------------|--------------------------------|
| id          | bigint        | PRIMARY KEY, AUTO_INCREMENT      | Unique image identifier        |
| product_id  | bigint        | FOREIGN KEY, NOT NULL            | Related product                |
| url         | varchar(255)  | NOT NULL                         | Image file path/URL            |
| is_primary  | boolean       | DEFAULT false                    | Primary image flag             |
| sort_order  | integer       | DEFAULT 0                        | Display order                  |
| created_at  | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record creation timestamp      |
| updated_at  | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record update timestamp        |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `product_id`

**Foreign Keys:**
- `product_id` REFERENCES `products(id)` ON DELETE CASCADE

---

### product_attributes
Stores product attributes like color, size, etc.

| Column      | Type          | Constraints                      | Description                    |
|-------------|---------------|----------------------------------|--------------------------------|
| id          | bigint        | PRIMARY KEY, AUTO_INCREMENT      | Unique attribute identifier    |
| product_id  | bigint        | FOREIGN KEY, NOT NULL            | Related product                |
| name        | varchar(100)  | NOT NULL                         | Attribute name (e.g., "Color") |
| value       | varchar(255)  | NOT NULL                         | Attribute value (e.g., "Blue") |
| created_at  | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record creation timestamp      |
| updated_at  | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record update timestamp        |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `product_id`

**Foreign Keys:**
- `product_id` REFERENCES `products(id)` ON DELETE CASCADE

---

### cart_items
Stores shopping cart items for users.

| Column      | Type          | Constraints                      | Description                    |
|-------------|---------------|----------------------------------|--------------------------------|
| id          | bigint        | PRIMARY KEY, AUTO_INCREMENT      | Unique cart item identifier    |
| user_id     | bigint        | FOREIGN KEY, NOT NULL            | Cart owner                     |
| product_id  | bigint        | FOREIGN KEY, NOT NULL            | Product in cart                |
| quantity    | integer       | NOT NULL, DEFAULT 1              | Quantity of product            |
| created_at  | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record creation timestamp      |
| updated_at  | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record update timestamp        |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `user_id, product_id`
- INDEX on `user_id`
- INDEX on `product_id`

**Foreign Keys:**
- `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- `product_id` REFERENCES `products(id)` ON DELETE CASCADE

---

### orders
Stores customer orders.

| Column          | Type          | Constraints                      | Description                    |
|-----------------|---------------|----------------------------------|--------------------------------|
| id              | bigint        | PRIMARY KEY, AUTO_INCREMENT      | Unique order identifier        |
| user_id         | bigint        | FOREIGN KEY, NOT NULL            | Customer who placed order      |
| order_number    | varchar(50)   | UNIQUE, NOT NULL                 | Human-readable order number    |
| status          | enum          | NOT NULL                         | Order status                   |
| subtotal        | decimal(10,2) | NOT NULL                         | Items total                    |
| tax             | decimal(10,2) | DEFAULT 0.00                     | Tax amount                     |
| shipping        | decimal(10,2) | DEFAULT 0.00                     | Shipping cost                  |
| total           | decimal(10,2) | NOT NULL                         | Grand total                    |
| payment_method  | varchar(50)   | NOT NULL                         | Payment method used            |
| payment_status  | enum          | NOT NULL                         | Payment status                 |
| notes           | text          | NULLABLE                         | Order notes                    |
| created_at      | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record creation timestamp      |
| updated_at      | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record update timestamp        |

**Enums:**
- `status`: pending, processing, shipped, delivered, cancelled, refunded
- `payment_status`: pending, paid, failed, refunded

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `order_number`
- INDEX on `user_id`
- INDEX on `status`
- INDEX on `created_at`

**Foreign Keys:**
- `user_id` REFERENCES `users(id)` ON DELETE RESTRICT

---

### order_items
Stores items within an order.

| Column      | Type          | Constraints                      | Description                    |
|-------------|---------------|----------------------------------|--------------------------------|
| id          | bigint        | PRIMARY KEY, AUTO_INCREMENT      | Unique order item identifier   |
| order_id    | bigint        | FOREIGN KEY, NOT NULL            | Related order                  |
| product_id  | bigint        | FOREIGN KEY, NOT NULL            | Product ordered                |
| quantity    | integer       | NOT NULL                         | Quantity ordered               |
| price       | decimal(10,2) | NOT NULL                         | Price at time of purchase      |
| created_at  | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record creation timestamp      |
| updated_at  | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record update timestamp        |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `order_id`
- INDEX on `product_id`

**Foreign Keys:**
- `order_id` REFERENCES `orders(id)` ON DELETE CASCADE
- `product_id` REFERENCES `products(id)` ON DELETE RESTRICT

---

### addresses
Stores shipping/billing addresses.

| Column      | Type          | Constraints                      | Description                    |
|-------------|---------------|----------------------------------|--------------------------------|
| id          | bigint        | PRIMARY KEY, AUTO_INCREMENT      | Unique address identifier      |
| user_id     | bigint        | FOREIGN KEY, NOT NULL            | Address owner                  |
| order_id    | bigint        | FOREIGN KEY, NULLABLE            | Related order (if applicable)  |
| type        | enum          | NOT NULL                         | Address type                   |
| name        | varchar(255)  | NOT NULL                         | Recipient name                 |
| address     | varchar(255)  | NOT NULL                         | Street address                 |
| city        | varchar(100)  | NOT NULL                         | City                           |
| state       | varchar(100)  | NOT NULL                         | State/Province                 |
| zip         | varchar(20)   | NOT NULL                         | Postal code                    |
| country     | varchar(100)  | NOT NULL                         | Country                        |
| phone       | varchar(20)   | NOT NULL                         | Contact phone number           |
| is_default  | boolean       | DEFAULT false                    | Default address flag           |
| created_at  | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record creation timestamp      |
| updated_at  | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record update timestamp        |

**Enums:**
- `type`: shipping, billing, both

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `order_id`

**Foreign Keys:**
- `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- `order_id` REFERENCES `orders(id)` ON DELETE SET NULL

---

### reviews
Stores product reviews.

| Column      | Type          | Constraints                      | Description                    |
|-------------|---------------|----------------------------------|--------------------------------|
| id          | bigint        | PRIMARY KEY, AUTO_INCREMENT      | Unique review identifier       |
| user_id     | bigint        | FOREIGN KEY, NOT NULL            | Reviewer                       |
| product_id  | bigint        | FOREIGN KEY, NOT NULL            | Reviewed product               |
| rating      | tinyint       | NOT NULL                         | Rating (1-5)                   |
| title       | varchar(255)  | NULLABLE                         | Review title                   |
| comment     | text          | NULLABLE                         | Review text                    |
| is_verified | boolean       | DEFAULT false                    | Verified purchase flag         |
| is_approved | boolean       | DEFAULT true                     | Admin approval flag            |
| created_at  | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record creation timestamp      |
| updated_at  | timestamp     | DEFAULT CURRENT_TIMESTAMP        | Record update timestamp        |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `product_id`
- INDEX on `rating`

**Foreign Keys:**
- `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- `product_id` REFERENCES `products(id)` ON DELETE CASCADE

---

## Relationships

### One-to-Many
- `users` → `cart_items`
- `users` → `orders`
- `users` → `addresses`
- `users` → `reviews`
- `categories` → `products`
- `categories` → `categories` (parent-child)
- `products` → `product_images`
- `products` → `product_attributes`
- `products` → `cart_items`
- `products` → `order_items`
- `products` → `reviews`
- `orders` → `order_items`
- `orders` → `addresses`

### Many-to-Many
None currently, but can be added for:
- Products ↔ Tags
- Products ↔ Related Products

---

## Sample Queries

### Get all products with category
```sql
SELECT p.*, c.name as category_name 
FROM products p 
JOIN categories c ON p.category_id = c.id 
WHERE p.is_active = 1;
```

### Get user's cart with products
```sql
SELECT ci.*, p.name, p.price, p.stock 
FROM cart_items ci 
JOIN products p ON ci.product_id = p.id 
WHERE ci.user_id = 1;
```

### Get order with items and products
```sql
SELECT o.*, oi.*, p.name as product_name 
FROM orders o 
JOIN order_items oi ON o.id = oi.order_id 
JOIN products p ON oi.product_id = p.id 
WHERE o.id = 1;
```

---

**Last Updated**: October 27, 2025
**Database Version**: 1.0
**Status**: Schema Design Phase

