# AGENTS.md

## Dev environment tips
- Install dependencies with `npm install` before running any commands.
- Copy `.env.example` to `.env` and set `SESSION_SECRET` (required) and `DATABASE_URL` (for API/DB features).
- Use `npm run dev` to start the development server (Express + Vite on port 5000).
- Run `npm run build` to compile frontend and backend for production.
- Store generated artefacts in `.context/` so reruns stay deterministic.
- Track bugs in `work-files/bugs-tracker.md`.

## Testing instructions
- First time: `npx playwright install chromium` (required for E2E).
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
  - `components/` — Componentes reutilizáveis (ImageUpload, ObjectUploader, PaginationControls)
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


---

# Reversa

> Framework de Engenharia Reversa instalado neste projeto.

## Como usar

Use o fluxo adequado no chat:

- `reversa` — descobrir e documentar um sistema existente
- `reversa-new` — criar PRD e specs para um projeto novo
- `reversa-forward` — implementar ou evoluir código a partir das specs
- `reversa-migrate` — planejar a migração de um sistema legado
- `reversa-docs` — gerar o mini-site visual da documentação
- `reversa-agents-help` — consultar o catálogo completo de agentes

## Comportamento ao ativar

Quando o usuário digitar `reversa` sozinho em uma mensagem:

1. Ative o skill `reversa` disponível em `.agents/skills/reversa/SKILL.md`
2. Leia o SKILL.md na íntegra e siga exatamente as instruções do Reversa

## Regra não-negociável

Por padrão, nunca apague, modifique ou sobrescreva arquivos pré-existentes do projeto legado:
o Reversa escreve apenas em `.reversa/`, `_reversa_sdd/`, `_reversa_docs/`, `_reversa_forward/`, `_reversa_bugs/` e `_reversa_refactor/`.
A única exceção é a política configurável abaixo, controlada exclusivamente pelo usuário.

Antes de criar, modificar ou apagar qualquer arquivo fora das pastas próprias do Reversa, leia `.reversa/reversa-config.json` e obedeça ao resultado:

- Arquivo ausente, JSON inválido ou campo com tipo errado: trate como `allowLegacyEdits: false` (falha segura, nenhuma escrita fora das pastas do Reversa).
- `allowLegacyEdits: false`: recuse a escrita, informando o caminho recusado, o estado atual da config e o que o usuário deve editar para liberar.
- `allowLegacyEdits: true` com `allowedPaths` não vazio: escreva apenas em caminhos que casem com algum glob da lista (globs relativos à raiz do projeto, com `/`, suportando `*` e `**`).
- `allowLegacyEdits: true` com `allowedPaths` vazio ou ausente: projeto liberado; avise uma vez por sessão que a liberação é irrestrita.

Nunca crie nem edite `.reversa/reversa-config.json` por iniciativa própria: pedido na conversa não é liberação implícita, alterações nesse arquivo são ato exclusivo do usuário.
