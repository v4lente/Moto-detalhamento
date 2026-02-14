---
slug: project-structure
category: architecture
generatedAt: 2026-02-13T00:00:00.000Z
---

# How is the codebase organized?

O projeto segue uma **arquitetura modular** com separação clara entre frontend, backend e código compartilhado.

## Project Structure

```
frontend/               # Código do cliente React
├── app/                # Bootstrap (App.tsx, main.tsx)
├── features/           # Features modulares por domínio
│   ├── admin/          # Painel administrativo
│   ├── auth/           # Autenticação
│   ├── cart/           # Carrinho de compras
│   ├── checkout/       # Fluxo de checkout
│   ├── products/       # Catálogo de produtos
│   ├── account/        # Área do cliente
│   ├── home/           # Página inicial
│   └── scheduling/     # Agendamento
├── shared/             # UI, hooks, lib compartilhados
└── pages/              # Páginas genéricas (404)

backend/                # Código do servidor Express
├── api/                # Routes + middleware
├── services/           # Serviços de negócio
└── infrastructure/     # DB, storage, email, payments

shared/                 # Código compartilhado
├── contracts/          # Tipos e validações (frontend-safe)
└── schema.ts           # Schema Drizzle (backend only)

scripts/                # Scripts de build/dev
db/                     # Configuração do banco
migrations/             # Migrações SQL
attached_assets/        # Assets estáticos
```

## Key Conventions

- **Frontend Features**: Cada feature é auto-contida com components, hooks, pages
- **Backend Layers**: Routes → Services → Infrastructure
- **Shared Contracts**: Tipos e validações compartilhados entre camadas
- **Path Alias**: `@/` aponta para `frontend/`

Para mais detalhes, veja [project-structure.md](../project-structure.md).
