## Project Overview

Moto Detalhamento is a full-stack ecommerce and service-booking experience for a motorcycle detailing business. It combines a product catalog and WhatsApp checkout with a service scheduling flow, plus an admin console for managing products, customers, orders, and appointments.

O projeto segue uma **arquitetura modular** com separação clara entre frontend, backend e código compartilhado.

## Quick Facts

- Root: `E:/Projects/Moto-detalhamento`
- Languages: TypeScript/TSX (~120 files)
- Architecture: Modular Monolith (Feature-Based Frontend + Layered Backend)

## Entry Points

| Camada | Entry Point | Descrição |
| --- | --- | --- |
| Frontend | `frontend/app/main.tsx` | Bootstrap React |
| Backend | `backend/api/index.ts` | Setup Express + middlewares |
| Database | `backend/infrastructure/db/index.ts` | Conexão + migrações |
| Build | `scripts/build.mjs` | Build pipeline |

## Key Exports

### Backend
- `DatabaseStorage`, `IStorage` — Data access layer (`backend/infrastructure/storage.ts`)
- `AuthService` — Autenticação (`backend/services/auth.service.ts`)
- `CheckoutService` — Processamento de pedidos (`backend/services/checkout.service.ts`)

### Frontend
- `CartProvider`, `CheckoutDialog` — Commerce UX (`frontend/features/cart/`)
- `apiRequest`, `queryClient` — API client (`frontend/shared/lib/queryClient.ts`)

### Shared
- `CheckoutData`, `Appointment`, `Customer` — Domain types (`shared/contracts/types.ts`)
- Zod schemas — Validation (`shared/contracts/validation.ts`)

## File Structure & Code Organization

### Frontend (`frontend/`)
- `app/` — Bootstrap da aplicação (App.tsx, main.tsx)
- `features/` — Features modulares por domínio:
  - `admin/` — Painel administrativo
  - `auth/` — Autenticação
  - `cart/` — Carrinho de compras
  - `checkout/` — Fluxo de checkout
  - `products/` — Catálogo de produtos
  - `account/` — Área do cliente
  - `home/` — Página inicial
  - `scheduling/` — Agendamento
- `shared/` — UI components, hooks, lib compartilhados
- `pages/` — Páginas genéricas (404)

### Backend (`backend/`)
- `api/` — API Express (routes, middleware)
- `services/` — Serviços de negócio
- `infrastructure/` — DB, storage, email, payments

### Shared (`shared/`)
- `contracts/` — Tipos e validações (frontend-safe)
- `schema.ts` — Schema Drizzle (backend only)

### Outros
- `scripts/` — Scripts de build/dev
- `migrations/` — Migrações SQL
- `attached_assets/` — Assets estáticos

## Technology Stack Summary

### Frontend
- React 19 + Vite 7 + TypeScript
- Tailwind CSS 4 + shadcn/ui + Radix UI
- TanStack Query 5 + Wouter 3
- Framer Motion + React Hook Form + Zod

### Backend
- Node.js 20 + Express 5 + TypeScript
- Drizzle ORM + MySQL 8
- express-session + Passport.js
- Resend (email) + Stripe (payments)

## Core Framework Stack

**Frontend**: React + Wouter routing + TanStack Query for server state  
**Backend**: Express + Drizzle ORM + MySQL  
**Shared contracts**: Types + Zod validation in `shared/contracts/`

## Development Tools Overview

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Dev server (Express + Vite) na porta 5000 |
| `npm run build` | Build de produção |
| `npm run db:push` | Sync schema (dev rápido) |
| `npm run db:migrate` | Aplica migrações |
| `npm run db:seed` | Popula dados iniciais |

## Getting Started Checklist

1. Install dependencies: `npm install`
2. Configure environment: set `DATABASE_URL` (and optional `SESSION_SECRET`)
3. Start dev server: `npm run dev`
4. Verify: open `http://localhost:5000` and load `/` plus `/admin`
5. Optional: run `npm run db:push` for quick schema sync in dev

## Next Steps

- Review [`architecture.md`](./architecture.md) for system boundaries
- Review [`project-structure.md`](./project-structure.md) for detailed directory structure
- Review [`development-workflow.md`](./development-workflow.md) for daily engineering flow
