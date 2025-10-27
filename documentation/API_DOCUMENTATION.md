# API Documentation

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication
This API will use Laravel Sanctum for authentication. Include the bearer token in the Authorization header:
```
Authorization: Bearer {token}
```

---

## API Endpoints

### Authentication

#### Register User
```http
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2025-10-27T00:00:00.000000Z"
  },
  "token": "1|laravel_sanctum_token..."
}
```

---

#### Login
```http
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "1|laravel_sanctum_token..."
}
```

---

#### Logout
```http
POST /api/v1/auth/logout
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### Products

#### Get All Products
```http
GET /api/v1/products
```

**Query Parameters:**
- `page` (integer): Page number for pagination
- `per_page` (integer): Items per page (default: 15)
- `category` (string): Filter by category
- `min_price` (decimal): Minimum price filter
- `max_price` (decimal): Maximum price filter
- `sort` (string): Sort by field (name, price, created_at)
- `order` (string): Sort order (asc, desc)
- `search` (string): Search in name and description

**Example:**
```http
GET /api/v1/products?page=1&per_page=20&category=electronics&sort=price&order=asc
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Product Name",
      "slug": "product-name",
      "description": "Product description",
      "price": 99.99,
      "sale_price": 79.99,
      "stock": 50,
      "category": {
        "id": 1,
        "name": "Electronics",
        "slug": "electronics"
      },
      "images": [
        {
          "id": 1,
          "url": "http://localhost:8000/storage/products/image1.jpg",
          "is_primary": true
        }
      ],
      "created_at": "2025-10-27T00:00:00.000000Z",
      "updated_at": "2025-10-27T00:00:00.000000Z"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/products?page=1",
    "last": "http://localhost:8000/api/v1/products?page=5",
    "prev": null,
    "next": "http://localhost:8000/api/v1/products?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "per_page": 15,
    "to": 15,
    "total": 75
  }
}
```

---

#### Get Single Product
```http
GET /api/v1/products/{id}
```

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "name": "Product Name",
    "slug": "product-name",
    "description": "Detailed product description",
    "price": 99.99,
    "sale_price": 79.99,
    "stock": 50,
    "sku": "PROD-001",
    "category": {
      "id": 1,
      "name": "Electronics",
      "slug": "electronics"
    },
    "images": [
      {
        "id": 1,
        "url": "http://localhost:8000/storage/products/image1.jpg",
        "is_primary": true
      },
      {
        "id": 2,
        "url": "http://localhost:8000/storage/products/image2.jpg",
        "is_primary": false
      }
    ],
    "attributes": [
      {
        "name": "Color",
        "value": "Black"
      },
      {
        "name": "Size",
        "value": "Medium"
      }
    ],
    "reviews_count": 25,
    "average_rating": 4.5,
    "created_at": "2025-10-27T00:00:00.000000Z",
    "updated_at": "2025-10-27T00:00:00.000000Z"
  }
}
```

---

#### Create Product (Admin)
```http
POST /api/v1/products
```

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data
```

**Request Body:**
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "sale_price": 79.99,
  "stock": 100,
  "sku": "PROD-002",
  "category_id": 1,
  "images": ["file1.jpg", "file2.jpg"]
}
```

**Response (201):**
```json
{
  "data": {
    "id": 2,
    "name": "New Product",
    "slug": "new-product",
    "description": "Product description",
    "price": 99.99,
    "created_at": "2025-10-27T00:00:00.000000Z"
  }
}
```

---

### Categories

#### Get All Categories
```http
GET /api/v1/categories
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic products",
      "image": "http://localhost:8000/storage/categories/electronics.jpg",
      "products_count": 50,
      "parent_id": null,
      "children": []
    }
  ]
}
```

---

### Cart

#### Get User Cart
```http
GET /api/v1/cart
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": {
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "Product Name",
          "price": 99.99,
          "image": "http://localhost:8000/storage/products/image1.jpg"
        },
        "quantity": 2,
        "subtotal": 199.98
      }
    ],
    "total": 199.98,
    "items_count": 2
  }
}
```

---

#### Add to Cart
```http
POST /api/v1/cart
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "product_id": 1,
  "quantity": 2
}
```

**Response (201):**
```json
{
  "message": "Product added to cart",
  "data": {
    "id": 1,
    "product_id": 1,
    "quantity": 2
  }
}
```

---

#### Update Cart Item
```http
PUT /api/v1/cart/{item_id}
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response (200):**
```json
{
  "message": "Cart updated",
  "data": {
    "id": 1,
    "quantity": 3
  }
}
```

---

#### Remove from Cart
```http
DELETE /api/v1/cart/{item_id}
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Item removed from cart"
}
```

---

### Orders

#### Get User Orders
```http
GET /api/v1/orders
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "order_number": "ORD-2025-0001",
      "status": "completed",
      "total": 299.97,
      "items_count": 3,
      "created_at": "2025-10-27T00:00:00.000000Z"
    }
  ]
}
```

---

#### Get Single Order
```http
GET /api/v1/orders/{id}
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "order_number": "ORD-2025-0001",
    "status": "completed",
    "items": [
      {
        "product": {
          "id": 1,
          "name": "Product Name",
          "image": "url"
        },
        "quantity": 2,
        "price": 99.99,
        "subtotal": 199.98
      }
    ],
    "subtotal": 199.98,
    "tax": 20.00,
    "shipping": 10.00,
    "total": 229.98,
    "shipping_address": {
      "name": "John Doe",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "USA"
    },
    "created_at": "2025-10-27T00:00:00.000000Z"
  }
}
```

---

#### Create Order
```http
POST /api/v1/orders
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "shipping_address": {
    "name": "John Doe",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA",
    "phone": "555-1234"
  },
  "payment_method": "credit_card",
  "payment_details": {
    "card_number": "4242424242424242",
    "exp_month": "12",
    "exp_year": "2026",
    "cvc": "123"
  }
}
```

**Response (201):**
```json
{
  "message": "Order created successfully",
  "data": {
    "id": 1,
    "order_number": "ORD-2025-0001",
    "status": "pending",
    "total": 229.98
  }
}
```

---

## Error Responses

### Validation Error (422)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": [
      "The email field is required."
    ],
    "password": [
      "The password must be at least 8 characters."
    ]
  }
}
```

### Unauthorized (401)
```json
{
  "message": "Unauthenticated."
}
```

### Forbidden (403)
```json
{
  "message": "This action is unauthorized."
}
```

### Not Found (404)
```json
{
  "message": "Resource not found."
}
```

### Server Error (500)
```json
{
  "message": "Server Error",
  "error": "Error details in development mode"
}
```

---

## Rate Limiting
- **Authenticated requests**: 60 requests per minute
- **Unauthenticated requests**: 30 requests per minute

---

## Pagination
All list endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 15, max: 100)

Pagination metadata is included in the response:
```json
{
  "data": [...],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "per_page": 15,
    "to": 15,
    "total": 75
  },
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  }
}
```

---

**Last Updated**: October 27, 2025
**API Version**: v1
**Status**: In Development

