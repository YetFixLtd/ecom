# E-Commerce Frontend (Next.js)

Next.js-based frontend application for the e-commerce platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm, yarn, or pnpm

### Installation

1. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. **Configure environment**
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Optional: Image base URL (defaults to API_URL without /api/v1)
NEXT_PUBLIC_IMAGE_BASE_URL=http://localhost:8000
```

3. **Start development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   ├── products/          # Product pages
│   │   ├── cart/              # Shopping cart
│   │   └── checkout/          # Checkout flow
│   ├── components/             # React components
│   │   ├── ui/                # UI components
│   │   ├── layout/            # Layout components
│   │   ├── product/           # Product components
│   │   └── cart/              # Cart components
│   ├── lib/                    # Utilities
│   │   ├── api.ts             # API client
│   │   └── utils.ts           # Helper functions
│   ├── hooks/                  # Custom hooks
│   ├── types/                  # TypeScript types
│   └── store/                  # State management
├── public/                     # Static assets
├── .env.local                  # Environment variables
└── next.config.ts              # Next.js configuration
```

## 🛠️ Development

### Common Commands

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

# Format code (if configured)
npm run format
```

## 🎨 Tech Stack

- **Framework**: Next.js 16.x (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.x
- **UI Library**: React 19.x
- **HTTP Client**: Fetch API
- **State Management**: React Context / Zustand (to be configured)
- **Form Handling**: React Hook Form (to be configured)
- **Validation**: Zod (to be configured)

## 🌐 API Integration

### API Client
Located at `src/lib/api.ts`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchProducts() {
  const response = await fetch(`${API_URL}/products`);
  return response.json();
}
```

### Server Components (Recommended)
```typescript
// app/products/page.tsx
import { fetchProducts } from '@/lib/api';

export default async function ProductsPage() {
  const products = await fetchProducts();
  return <ProductList products={products} />;
}
```

### Client Components
```typescript
'use client';

import { useState, useEffect } from 'react';

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);
  
  return (/* JSX */);
}
```

## 🎯 Features

### Current
- ✅ Next.js 16 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS styling
- ✅ ESLint configuration
- ✅ Environment variables setup

### Planned
- 🚧 Product catalog
- 🚧 Shopping cart
- 🚧 User authentication
- 🚧 Checkout process
- 🚧 Order history
- 🚧 Product search
- 🚧 Product filters
- 🚧 User profile
- 🚧 Reviews and ratings

## 🧱 Components

### UI Components
Create reusable components in `src/components/ui/`:
- Button
- Input
- Card
- Modal
- etc.

### Layout Components
Create layout components in `src/components/layout/`:
- Header
- Footer
- Navigation
- Sidebar

### Feature Components
Create feature-specific components:
- `src/components/product/` - Product-related
- `src/components/cart/` - Cart-related
- `src/components/checkout/` - Checkout-related

## 📱 Responsive Design

This project uses Tailwind CSS for responsive design:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

## 🖼️ Image Optimization

Use Next.js Image component for optimized images:

```tsx
import Image from 'next/image';

<Image 
  src="/products/image.jpg"
  alt="Product"
  width={500}
  height={500}
  priority
/>
```

## 🔐 Authentication

Authentication will be implemented using Laravel Sanctum:

```typescript
// Login
const response = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const { token } = await response.json();
localStorage.setItem('token', token);
```

## 🧪 Testing

### Install Testing Libraries
```bash
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

### Run Tests
```bash
npm run test
```

## 🎨 Styling

### Tailwind CSS
Configure in `tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: '#your-color',
      },
    },
  },
};
```

### Global Styles
Located at `src/app/globals.css`

## 📦 Recommended Packages

### UI Components
```bash
npm install @headlessui/react lucide-react
```

### Form Handling
```bash
npm install react-hook-form zod @hookform/resolvers
```

### HTTP Client
```bash
npm install axios  # Optional, if not using fetch
```

### State Management
```bash
npm install zustand  # Lightweight state management
# or
npm install @reduxjs/toolkit react-redux
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms
- Netlify
- AWS Amplify
- DigitalOcean App Platform

**Full deployment guide**: [../documentation/DEPLOYMENT.md](../documentation/DEPLOYMENT.md)

## 🐛 Troubleshooting

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9
```

### Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

### Environment Variables Not Working
- Ensure variables start with `NEXT_PUBLIC_` for client-side
- Restart dev server after changes

## 📚 Documentation

For detailed documentation, see:
- [Frontend Setup Guide](../documentation/FRONTEND_SETUP.md)
- [API Documentation](../documentation/API_DOCUMENTATION.md)
- [Main README](../README.md)

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use ESLint for code quality
3. Write meaningful component names
4. Keep components small and focused
5. Update documentation

## 📝 Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use functional components
- Prefer Server Components when possible

---

**Part of the E-Commerce Platform**
- [Main README](../README.md)
- [Backend README](../backend/README.md)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
