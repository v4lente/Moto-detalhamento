# Documentation Index

Welcome to the repository knowledge base. Start with the project overview, then dive into specific guides as needed.

## Core Guides
- [Project Overview](./project-overview.md)
- [Project Structure](./project-structure.md)
- [Architecture Notes](./architecture.md)
- [Assets Strategy](./assets-strategy.md)
- [Development Workflow](./development-workflow.md)
- [Testing Strategy](./testing-strategy.md)
- [Glossary & Domain Concepts](./glossary.md)
- [Data Flow & Integrations](./data-flow.md)
- [Security & Compliance Notes](./security.md)
- [Tooling & Productivity Guide](./tooling.md)
- [Boundary Rules](./boundary-rules.md)
- [Release Guide](./release-guide.md)

## Repository Snapshot (Arquitetura Modular)

### Frontend (`frontend/`)
- `frontend/app/` — Bootstrap da aplicação (App.tsx, main.tsx)
- `frontend/features/` — Features modulares por domínio
  - `admin/` — Painel administrativo
  - `auth/` — Autenticação
  - `cart/` — Carrinho de compras
  - `checkout/` — Fluxo de checkout
  - `products/` — Catálogo de produtos
  - `account/` — Área do cliente
  - `home/` — Página inicial
  - `scheduling/` — Agendamento
- `frontend/shared/` — UI, hooks, lib compartilhados
- `frontend/pages/` — Páginas genéricas (404)

### Backend (`backend/`)
- `backend/api/` — API Express (routes, middleware)
- `backend/services/` — Serviços de negócio
- `backend/infrastructure/` — DB, storage, email, payments

### Shared (`shared/`)
- `shared/contracts/` — Tipos e validações (frontend-safe)
- `shared/schema.ts` — Schema Drizzle (backend only)

### Outros
- `scripts/` — Scripts de build/dev
- `db/` — Configuração do banco
- `migrations/` — Migrações SQL
- `attached_assets/` — Assets estáticos

### Configuração
- `package.json` — Dependências e scripts
- `tsconfig.json` — Config TypeScript raiz
- `tsconfig.base.json` — Config TS base
- `vite.config.ts` — Configuração Vite
- `drizzle.config.ts` — Configuração Drizzle
- `components.json` — Configuração shadcn/ui

## Document Map
| Guide | File | Primary Inputs |
| --- | --- | --- |
| Project Overview | `project-overview.md` | Roadmap, README, stakeholder notes |
| Project Structure | `project-structure.md` | Estrutura de diretórios, convenções |
| Architecture Notes | `architecture.md` | ADRs, service boundaries, dependency graphs |
| Development Workflow | `development-workflow.md` | Branching rules, CI config, contributing guide |
| Testing Strategy | `testing-strategy.md` | Test configs, CI gates, known flaky suites |
| Glossary & Domain Concepts | `glossary.md` | Business terminology, user personas, domain rules |
| Data Flow & Integrations | `data-flow.md` | System diagrams, integration specs, queue topics |
| Security & Compliance Notes | `security.md` | Auth model, secrets management, compliance requirements |
| Tooling & Productivity Guide | `tooling.md` | CLI scripts, IDE configs, automation workflows |
| Boundary Rules | `boundary-rules.md` | Module boundaries, import rules, validation commands |
| Release Guide | `release-guide.md` | Deploy checklist, rollback plan, breaking changes |
