## Project Overview
Moto Detalhamento is a full-stack ecommerce and service-booking experience for a motorcycle detailing business. It combines a product catalog and WhatsApp checkout with a service scheduling flow, plus an admin console for managing products, customers, orders, and appointments.

## Codebase Reference
> **Detailed Analysis**: For complete symbol counts, architecture layers, and dependency graphs, see [`codebase-map.json`](./codebase-map.json).

## Quick Facts
- Root: `E:/Projects/Moto-detalhamento`
- Languages: TypeScript/TSX (22 `.ts`, 76 `.tsx`), JavaScript (1 `.js`)
- Entry: `server/index.ts`, `client/src/main.tsx`, `db/index.ts`, `server/replit_integrations/object_storage/index.ts`
- Full analysis: [`codebase-map.json`](./codebase-map.json)

## Entry Points
- API/server bootstrap: [`server/index.ts`](../../server/index.ts#L1)
- Client bootstrap: [`client/src/main.tsx`](../../client/src/main.tsx#L1)
- Database + migrations: [`db/index.ts`](../../db/index.ts#L1)
- Object storage exports: [`server/replit_integrations/object_storage/index.ts`](../../server/replit_integrations/object_storage/index.ts#L1)
- Build pipeline: [`script/build.ts`](../../script/build.ts#L1)

## Key Exports
- `DatabaseStorage`, `IStorage` for persistence access (`server/storage.ts`)
- `CheckoutData`, `Appointment`, `Customer` domain types (`shared/schema.ts`)
- `apiRequest`, `queryClient` for API use (`client/src/lib/queryClient.ts`)
- `CartProvider`, `CheckoutDialog` for commerce UX (`client/src/lib/cart.tsx`, `client/src/components/checkout-dialog.tsx`)
> See [`codebase-map.json`](./codebase-map.json) for the full list of exported symbols.

## File Structure & Code Organization
- `client/` — React UI, routes, pages, and UI components
- `server/` — Express API, auth, storage, and integrations
- `shared/` — Drizzle + Zod schemas shared across layers
- `db/` — Database connection and migration execution
- `migrations/` — SQL migration files and metadata
- `attached_assets/` — Uploaded static media served from `/assets`
- `script/` — build automation helpers

## Technology Stack Summary
The app is written in TypeScript across frontend and backend. The client uses React with Vite for bundling, Tailwind CSS for styling, and TanStack Query for data fetching. The server is an Express app using Drizzle ORM and PostgreSQL for persistence, with session-based authentication and object storage integration.

## Core Framework Stack
Frontend: React + Wouter routing + TanStack Query for server state.  
Backend: Express + Drizzle ORM + Postgres.  
Shared contracts: Drizzle schema + Zod validation in `shared/schema.ts`.

## UI & Interaction Libraries
shadcn/ui + Radix UI primitives, Lucide icons, Framer Motion, React Hook Form, and React Day Picker support the UI layer.

## Development Tools Overview
`npm run dev` runs the server with Vite integration, `npm run build` produces the production bundle, and `drizzle-kit` manages migrations. See [`tooling.md`](./tooling.md) for detailed setup.

## Getting Started Checklist
1. Install dependencies: `npm install`.
2. Configure environment: set `DATABASE_URL` (and optional `SESSION_SECRET`).
3. Start dev server: `npm run dev`.
4. Verify: open `http://localhost:5000` and load `/` plus `/admin`.
5. Optional: run `npm run db:push` for quick schema sync in dev.

## Next Steps
Review [`architecture.md`](./architecture.md) for system boundaries and [`development-workflow.md`](./development-workflow.md) for daily engineering flow.
