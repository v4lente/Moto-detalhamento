# Daniel Valente Moto Detalhamento

## Overview

This is a motorcycle detailing e-commerce website for "Daniel Valente Moto Detalhamento" - a Brazilian business specializing in premium motorcycle care products and services. The application features a product catalog, shopping cart with WhatsApp checkout integration, and an admin panel for managing products and site settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for cart state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a standard React SPA pattern with pages in `client/src/pages/`, reusable components in `client/src/components/`, and shared utilities in `client/src/lib/`.

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Management**: express-session with MemoryStore (development) or connect-pg-simple (production)
- **Authentication**: Custom session-based auth with scrypt password hashing

The server follows a modular pattern:
- `server/index.ts` - Express app setup and middleware
- `server/routes.ts` - API route definitions
- `server/storage.ts` - Database access layer using Drizzle
- `server/static.ts` - Static file serving for production builds

### Data Models
Three main entities defined in `shared/schema.ts`:
1. **Users** - Admin authentication (id, username, password)
2. **Products** - Product catalog (name, description, price, image, category)
3. **SiteSettings** - Configurable site content (WhatsApp number, hero text, branding)

### Key Design Patterns
- **Shared Schema**: Drizzle schemas in `shared/` are used by both frontend (via Zod validation) and backend
- **API Layer**: Frontend uses a centralized API client in `client/src/lib/api.ts`
- **Cart Persistence**: Shopping cart stored in localStorage with React Context wrapper

## External Dependencies

### Database
- **PostgreSQL** - Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle Kit** - Schema migrations with `npm run db:push`

### Third-Party Services
- **WhatsApp Business API** - Checkout redirects customers to WhatsApp with pre-filled order message
- **Google Fonts** - Oxanium (display) and Inter (UI) fonts loaded via CDN

### UI Component Libraries
- **Radix UI** - Headless accessible primitives (dialogs, dropdowns, tooltips, etc.)
- **shadcn/ui** - Pre-styled components built on Radix
- **Lucide React** - Icon library

### Development Tools
- **Vite** - Development server with HMR
- **esbuild** - Production bundling for server code
- **TypeScript** - Full type safety across client and server