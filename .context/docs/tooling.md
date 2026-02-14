## Tooling & Productivity Guide

This repo relies on Node tooling, Vite, and Drizzle for a fast full-stack workflow. Most developer tasks are handled through `npm` scripts.

## Required Tooling

- **Node.js 20.x**: Runtime for server and build scripts
- **npm**: Dependency management and scripts (`package.json`)
- **MySQL 8.x**: Backing database (required `DATABASE_URL`)
- **Drizzle Kit**: Schema management (`npm run db:push`)

## Recommended Automation

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Dev server integrado (Express + Vite) na porta 5000 |
| `npm run build` | Build de produção (frontend + backend) |
| `npm run start` | Executa servidor compilado |
| `npm run check` | Validação TypeScript |
| `npm run db:push` | Sync schema rápido (dev) |
| `npm run db:migrate` | Aplica migrações SQL |
| `npm run db:seed` | Popula dados iniciais |
| `npm run db:setup` | Migrações + seed completo |

## IDE / Editor Setup

- TypeScript + ESLint extensions
- Tailwind CSS IntelliSense for class usage
- MySQL client or SQL extension for migrations
- Path alias support (`@/` → `frontend/`)

## Productivity Tips

- Use the same `DATABASE_URL` for local testing and dev server to avoid migration drift
- Keep `attached_assets/` and `public/uploads/` updated if you test upload flows locally
- Use `npm run db:push` for rapid iteration, `npm run db:migrate` for production-like testing

## Project Scripts (`scripts/`)

| Script | Descrição |
| --- | --- |
| `build.mjs` | Build pipeline (frontend + backend) |
| `run-migrations.mjs` | Executa migrações (Node puro) |
| `run-seed.mjs` | Executa seed (Node puro) |
| `postbuild-db.mjs` | Setup pós-build para produção |
| `check-migrations.mjs` | Verifica migrações pendentes |
| `smoke-test-api.mjs` | Testes de smoke da API |

See [`development-workflow.md`](./development-workflow.md) for daily command usage.
