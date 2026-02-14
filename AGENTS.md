# AGENTS.md

## Dev environment tips
- Install dependencies with `npm install` before running any commands.
- Use `npm run dev` to start the development server (Express + Vite on port 5000).
- Run `npm run build` to compile frontend and backend for production.
- Store generated artefacts in `.context/` so reruns stay deterministic.

## Testing instructions
- Execute `npm run test` to run the test suite.
- Append `-- --watch` while iterating on a failing spec.
- Trigger `npm run build && npm run test` before opening a PR to mimic CI.
- Add or update tests alongside any feature changes.

## PR instructions
- Follow Conventional Commits (for example, `feat(products): add variation support`).
- Cross-link new features in `.context/docs/README.md` so future agents can find them.
- Attach sample CLI output or generated markdown when behaviour shifts.
- Confirm the built artefacts match the new source changes.

## Repository map (Arquitetura Modular)

### Frontend (`frontend/`)
- `frontend/app/` — Bootstrap da aplicação (App.tsx, main.tsx, index.css)
- `frontend/features/` — Features modulares organizadas por domínio:
  - `admin/` — Painel administrativo (pages, components, hooks)
  - `auth/` — Autenticação de clientes
  - `cart/` — Carrinho de compras (context, checkout dialog)
  - `checkout/` — Fluxo de checkout e confirmação
  - `products/` — Catálogo e detalhes de produtos
  - `account/` — Área do cliente
  - `home/` — Página inicial
  - `scheduling/` — Agendamento de serviços
- `frontend/shared/` — Código compartilhado do frontend:
  - `ui/` — Componentes shadcn/ui (50+)
  - `components/` — Componentes reutilizáveis (ImageUpload, ObjectUploader)
  - `hooks/` — Custom hooks (use-mobile, use-toast, use-upload)
  - `lib/` — Utilitários (api, queryClient, utils)
  - `layout/` — Layout principal com header/footer
- `frontend/pages/` — Páginas genéricas (404, etc)

### Backend (`backend/`)
- `backend/api/` — API Express:
  - `routes/` — Rotas organizadas por domínio (products, orders, auth, etc)
  - `middleware/` — Middlewares (auth, etc)
  - `index.ts` — Entry point do servidor
  - `vite.ts` — Dev server integration
  - `static.ts` — Prod static serving
- `backend/services/` — Serviços de negócio:
  - `auth.service.ts` — Autenticação
  - `checkout.service.ts` — Processamento de pedidos
  - `appointment.service.ts` — Agendamentos
- `backend/infrastructure/` — Infraestrutura:
  - `db/` — Conexão, migrações e seed
  - `storage.ts` — Data access layer (Repository pattern)
  - `email/` — Serviço de email (Resend)
  - `payments/` — Serviço de pagamentos (Stripe)

### Shared (`shared/`)
- `shared/contracts/` — Tipos e validações compartilhados (frontend-safe):
  - `types.ts` — Tipos TypeScript
  - `validation.ts` — Schemas Zod
  - `index.ts` — Re-exports
- `shared/schema.ts` — Schema Drizzle ORM (backend only)

### Outros diretórios
- `scripts/` — Scripts de build, migrações e seed
- `db/` — Configuração de conexão com o banco
- `migrations/` — Arquivos SQL de migração
- `attached_assets/` — Assets estáticos uploadados
- `public/uploads/` — Imagens de produtos e serviços

## Convenções de código

### Nomenclatura de arquivos
- Features: `kebab-case` para diretórios, `PascalCase` para componentes
- Rotas backend: `{domain}.routes.ts` (ex: `products.routes.ts`)
- Services: `{domain}.service.ts` (ex: `checkout.service.ts`)
- Hooks: `use-{name}.ts` (ex: `use-mobile.tsx`)

### Imports
- Frontend usa path aliases: `@/` aponta para `frontend/`
- Exemplo: `import { Button } from "@/shared/ui/button"`

### Estrutura de features
Cada feature deve conter:
```
features/{nome}/
├── components/     # Componentes específicos da feature
├── hooks/          # Hooks específicos
├── pages/          # Páginas da feature
├── lib/            # Utilitários específicos (opcional)
└── index.tsx       # Entry point da feature
```

## AI Context References
- Documentation index: `.context/docs/README.md`
- Architecture notes: `.context/docs/architecture.md`
- Project structure: `.context/docs/project-structure.md`
- Contributor guide: `CONTRIBUTING.md`
