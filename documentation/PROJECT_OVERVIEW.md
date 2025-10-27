# E-Commerce Project Overview

## Project Description
A modern, full-stack e-commerce application built with Laravel (backend) and Next.js (frontend).

## Architecture

### Backend - Laravel
- **Version**: Laravel 12.x
- **Location**: `/backend`
- **Purpose**: RESTful API server, authentication, business logic, and database management
- **Database**: SQLite (default, can be configured to MySQL/PostgreSQL)
- **Key Features**:
  - User authentication & authorization
  - Product management
  - Order processing
  - Payment integration ready
  - API endpoints for frontend consumption

### Frontend - Next.js
- **Version**: Next.js 16.x
- **Location**: `/frontend`
- **Purpose**: Client-side application with server-side rendering capabilities
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **Key Features**:
  - Modern, responsive UI
  - Server-side rendering (SSR)
  - Static site generation (SSG) where applicable
  - Type-safe development with TypeScript
  - Optimized performance

## Project Structure
```
ecom/
├── backend/              # Laravel API application
│   ├── app/             # Application code
│   ├── config/          # Configuration files
│   ├── database/        # Migrations, seeders, factories
│   ├── routes/          # API routes
│   └── tests/           # Backend tests
├── frontend/            # Next.js application
│   ├── src/
│   │   ├── app/        # App router pages
│   │   └── components/ # React components
│   ├── public/         # Static assets
│   └── tests/          # Frontend tests
├── documentation/       # Project documentation
└── README.md           # Main project README
```

## Technology Stack

### Backend
- **Framework**: Laravel 12.x
- **Language**: PHP 8.2+
- **Database**: SQLite/MySQL/PostgreSQL
- **Testing**: PHPUnit
- **Code Quality**: Laravel Pint (PHP CS Fixer)

### Frontend
- **Framework**: Next.js 16.x
- **Language**: TypeScript
- **UI Framework**: React 19.x
- **Styling**: Tailwind CSS 4.x
- **Linting**: ESLint
- **Testing**: Jest (to be configured)

## Development Workflow

### Getting Started
1. Set up backend (see `BACKEND_SETUP.md`)
2. Set up frontend (see `FRONTEND_SETUP.md`)
3. Configure environment variables
4. Run migrations
5. Start development servers

### Development Servers
- **Backend**: `http://localhost:8000` (Laravel)
- **Frontend**: `http://localhost:3000` (Next.js)

## API Communication
- Backend exposes RESTful API endpoints
- Frontend consumes API via HTTP client (Axios/Fetch)
- CORS configured for local development
- Authentication via Laravel Sanctum (to be configured)

## Version Control
- Git repository initialized
- `.gitignore` configured for both Laravel and Next.js
- Separate git histories for backend and frontend (optional)

## Next Steps
1. Configure Laravel Sanctum for API authentication
2. Set up CORS in Laravel
3. Create API endpoints for e-commerce features
4. Build frontend components and pages
5. Implement state management (Context API/Redux)
6. Set up testing infrastructure
7. Configure CI/CD pipeline

## Documentation Files
- `PROJECT_OVERVIEW.md` - This file
- `BACKEND_SETUP.md` - Backend setup and configuration
- `FRONTEND_SETUP.md` - Frontend setup and configuration
- `API_DOCUMENTATION.md` - API endpoints documentation
- `DATABASE_SCHEMA.md` - Database structure and relationships
- `DEPLOYMENT.md` - Deployment instructions

---

**Last Updated**: October 27, 2025
**Project Status**: Initial Setup Phase

