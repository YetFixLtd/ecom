# Frontend Setup Guide (Next.js)

## Prerequisites
- Node.js 18.x or higher
- npm or yarn or pnpm
- Git

## Installation Steps

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
Dependencies are already installed during project initialization. If needed:
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Configuration
Create a `.env.local` file in the frontend directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Application
NEXT_PUBLIC_APP_NAME="E-Commerce Store"
```

## Running the Development Server

### Start Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Server will run at: `http://localhost:3000`

### Build for Production
```bash
npm run build
npm run start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                   # App Router
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   ├── products/         # Product pages
│   │   ├── cart/             # Shopping cart
│   │   ├── checkout/         # Checkout flow
│   │   └── api/              # API routes (optional)
│   ├── components/            # React components
│   │   ├── ui/               # UI components
│   │   ├── layout/           # Layout components
│   │   ├── product/          # Product components
│   │   └── cart/             # Cart components
│   ├── lib/                   # Utility functions
│   │   ├── api.ts            # API client
│   │   ├── utils.ts          # Helper functions
│   │   └── validators.ts     # Validation schemas
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript types
│   ├── store/                 # State management (Context/Redux)
│   └── styles/                # Global styles
├── public/                    # Static assets
│   ├── images/
│   └── icons/
├── .env.local                 # Environment variables
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies
```

## Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Type check
npm run type-check
```

## Configuration Files

### Next.js Configuration (`next.config.ts`)
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
```

### Tailwind Configuration (`tailwind.config.ts`)
Customize your design system in this file.

## API Integration

### Creating API Client (`src/lib/api.ts`)
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchProducts() {
  const response = await fetch(`${API_URL}/products`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export async function fetchProduct(id: string) {
  const response = await fetch(`${API_URL}/products/${id}`);
  if (!response.ok) throw new Error('Failed to fetch product');
  return response.json();
}
```

### Using Server Components (Recommended)
```typescript
// app/products/page.tsx
import { fetchProducts } from '@/lib/api';

export default async function ProductsPage() {
  const products = await fetchProducts();
  
  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Using Client Components
```typescript
'use client';

import { useState, useEffect } from 'react';
import { fetchProducts } from '@/lib/api';

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);
  
  return (/* JSX */);
}
```

## State Management

### Option 1: React Context (Recommended for Simple State)
```typescript
// src/store/CartContext.tsx
'use client';

import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  
  const addToCart = (product) => {
    setCart([...cart, product]);
  };
  
  return (
    <CartContext.Provider value={{ cart, addToCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
```

### Option 2: Zustand (Lightweight State Management)
```bash
npm install zustand
```

```typescript
// src/store/useCartStore.ts
import { create } from 'zustand';

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ 
    items: [...state.items, item] 
  })),
  removeItem: (id) => set((state) => ({ 
    items: state.items.filter((item) => item.id !== id) 
  })),
}));
```

## TypeScript Types

### Define Types (`src/types/index.ts`)
```typescript
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed';
}
```

## Styling with Tailwind CSS

### Custom Theme Configuration
Edit `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#your-color',
        secondary: '#your-color',
      },
    },
  },
  plugins: [],
};

export default config;
```

## Recommended Packages

### UI Components
```bash
# Headless UI components
npm install @headlessui/react

# Icons
npm install lucide-react
# or
npm install react-icons
```

### Form Handling
```bash
npm install react-hook-form
npm install zod  # For validation
npm install @hookform/resolvers
```

### HTTP Client
```bash
npm install axios
# or use built-in fetch
```

### State Management (if needed)
```bash
npm install zustand
# or
npm install @reduxjs/toolkit react-redux
```

### Image Optimization
Next.js has built-in Image component - use it!
```typescript
import Image from 'next/image';

<Image 
  src="/products/image.jpg" 
  alt="Product" 
  width={500} 
  height={500}
/>
```

## Testing

### Install Testing Libraries
```bash
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

### Configure Jest (`jest.config.js`)
```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
};

module.exports = createJestConfig(customJestConfig);
```

## Performance Optimization

### Image Optimization
- Use Next.js `Image` component
- Optimize images before upload
- Use WebP format

### Code Splitting
- Automatic with Next.js App Router
- Use dynamic imports for heavy components:
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <p>Loading...</p>
});
```

### Caching
- Use React Server Components for data fetching
- Implement proper cache strategies:
```typescript
export const revalidate = 3600; // Revalidate every hour
```

## Best Practices

1. **Use Server Components** by default, Client Components when needed
2. **TypeScript** for type safety
3. **Use the App Router** (already configured)
4. **Optimize Images** with Next.js Image component
5. **Implement proper error boundaries**
6. **Use environment variables** for configuration
7. **Write meaningful commit messages**
8. **Keep components small and focused**
9. **Use proper folder structure**
10. **Document complex logic**

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

### Type Errors
```bash
npm run type-check
```

---

**Last Updated**: October 27, 2025

