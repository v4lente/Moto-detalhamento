# Project Structure

Este documento descreve a estrutura completa de diretórios do projeto Moto Detalhamento após a refatoração para arquitetura modular.

## Visão Geral

```
/
├── frontend/           # Código do cliente React
├── backend/            # Código do servidor Express
├── shared/             # Código compartilhado (contratos)
├── scripts/            # Scripts de build/dev
├── db/                 # Configuração do banco
├── migrations/         # Migrações SQL
├── attached_assets/    # Assets estáticos
└── public/             # Arquivos públicos
```

## Frontend (`frontend/`)

O frontend segue uma arquitetura baseada em features (domínios de negócio).

### Estrutura

```
frontend/
├── app/                        # Bootstrap da aplicação
│   ├── App.tsx                 # Componente raiz com rotas
│   ├── main.tsx                # Entry point React
│   └── index.css               # Estilos globais (Tailwind)
│
├── features/                   # Features modulares por domínio
│   ├── admin/                  # Painel administrativo
│   │   ├── components/         # Componentes específicos
│   │   │   ├── admin-navbar.tsx
│   │   │   └── admin-layout.tsx
│   │   ├── hooks/              # Hooks específicos
│   │   │   └── use-admin.ts
│   │   ├── pages/              # Páginas do admin
│   │   │   ├── dashboard.tsx
│   │   │   ├── products-management.tsx
│   │   │   ├── orders-management.tsx
│   │   │   ├── customers-management.tsx
│   │   │   ├── appointments-management.tsx
│   │   │   ├── gallery-management.tsx
│   │   │   ├── services-management.tsx
│   │   │   ├── users-management.tsx
│   │   │   └── settings.tsx
│   │   └── index.tsx           # Entry point da feature
│   │
│   ├── auth/                   # Autenticação
│   │   └── pages/
│   │       └── login.tsx
│   │
│   ├── cart/                   # Carrinho de compras
│   │   ├── components/
│   │   │   └── checkout-dialog.tsx
│   │   └── lib/
│   │       └── cart.tsx        # CartContext + Provider
│   │
│   ├── checkout/               # Fluxo de checkout
│   │   └── pages/
│   │       ├── checkout-success.tsx
│   │       └── checkout-cancel.tsx
│   │
│   ├── products/               # Catálogo de produtos
│   │   ├── components/
│   │   │   └── product-card.tsx
│   │   └── pages/
│   │       ├── produtos.tsx    # Listagem
│   │       └── produto.tsx     # Detalhes
│   │
│   ├── account/                # Área do cliente
│   │   └── pages/
│   │       └── conta.tsx
│   │
│   ├── home/                   # Página inicial
│   │   └── pages/
│   │       └── home.tsx
│   │
│   └── scheduling/             # Agendamento de serviços
│       └── pages/
│           └── agendar.tsx
│
├── pages/                      # Páginas genéricas
│   └── not-found.tsx           # 404
│
├── shared/                     # Código compartilhado do frontend
│   ├── ui/                     # Componentes shadcn/ui (50+)
│   │   ├── accordion.tsx
│   │   ├── alert.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   └── ... (50+ componentes)
│   │
│   ├── components/             # Componentes reutilizáveis
│   │   ├── ImageUpload.tsx     # Upload com crop
│   │   └── ObjectUploader.tsx  # Upload para storage
│   │
│   ├── hooks/                  # Custom hooks
│   │   ├── use-mobile.tsx      # Detecção de dispositivo
│   │   ├── use-toast.ts        # Sistema de toasts
│   │   └── use-upload.ts       # Upload de arquivos
│   │
│   ├── lib/                    # Utilitários
│   │   ├── api.ts              # Cliente HTTP
│   │   ├── api-config.ts       # Configuração da API
│   │   ├── queryClient.ts      # React Query setup
│   │   ├── stripe.ts           # Integração Stripe
│   │   └── utils.ts            # Helpers (cn, formatters)
│   │
│   └── layout/                 # Layout principal
│       └── layout.tsx          # Header + Footer
│
├── index.html                  # Template HTML
└── tsconfig.json               # Config TS do frontend
```

### Convenções do Frontend

- **Path Alias**: `@/` aponta para `frontend/`
- **Imports**: `import { Button } from "@/shared/ui/button"`
- **Features**: Cada feature é auto-contida com seus próprios components, hooks, pages
- **Shared**: Código reutilizado entre múltiplas features

## Backend (`backend/`)

O backend segue uma arquitetura em camadas: Routes → Services → Infrastructure.

### Estrutura

```
backend/
├── api/                        # API Express
│   ├── routes/                 # Rotas por domínio
│   │   ├── index.ts            # Registra todas as rotas
│   │   ├── auth.routes.ts      # Autenticação
│   │   ├── products.routes.ts  # Produtos
│   │   ├── orders.routes.ts    # Pedidos
│   │   ├── customers.routes.ts # Clientes
│   │   ├── appointments.routes.ts # Agendamentos
│   │   ├── services.routes.ts  # Serviços oferecidos
│   │   ├── settings.routes.ts  # Configurações do site
│   │   ├── uploads.routes.ts   # Upload de arquivos
│   │   ├── users.routes.ts     # Usuários admin
│   │   └── health.routes.ts    # Health check
│   │
│   ├── middleware/             # Middlewares
│   │   └── auth.ts             # Autenticação/autorização
│   │
│   ├── index.ts                # Entry point do servidor
│   ├── vite.ts                 # Dev server (Vite integration)
│   └── static.ts               # Prod static serving
│
├── services/                   # Serviços de negócio
│   ├── auth.service.ts         # Lógica de autenticação
│   ├── checkout.service.ts     # Processamento de pedidos
│   └── appointment.service.ts  # Lógica de agendamentos
│
├── infrastructure/             # Infraestrutura
│   ├── db/                     # Banco de dados
│   │   ├── index.ts            # Conexão + pool
│   │   ├── migrate.ts          # Execução de migrações
│   │   └── seed.ts             # Dados iniciais
│   │
│   ├── storage.ts              # Data access layer (Repository)
│   │
│   ├── email/                  # Serviço de email
│   │   └── resend.service.ts   # Integração Resend
│   │
│   └── payments/               # Serviço de pagamentos
│       └── stripe.service.ts   # Integração Stripe
│
└── tsconfig.json               # Config TS do backend
```

### Convenções do Backend

- **Rotas**: `{domain}.routes.ts` (ex: `products.routes.ts`)
- **Services**: `{domain}.service.ts` (ex: `checkout.service.ts`)
- **Prefixo API**: Todas as rotas começam com `/api/`
- **Autenticação**: Middleware `requireAuth` para rotas protegidas

## Shared (`shared/`)

Código compartilhado entre frontend e backend.

### Estrutura

```
shared/
├── contracts/                  # Tipos e validações (frontend-safe)
│   ├── types.ts                # Tipos TypeScript
│   ├── validation.ts           # Schemas Zod
│   └── index.ts                # Re-exports
│
└── schema.ts                   # Schema Drizzle ORM (backend only)
```

### Convenções do Shared

- **contracts/**: Pode ser importado pelo frontend e backend
- **schema.ts**: Apenas backend (depende de Drizzle)

## Scripts (`scripts/`)

Scripts de build, migrações e utilitários.

```
scripts/
├── build.mjs                   # Build script (frontend + backend)
├── run-migrations.mjs          # Executa migrações
├── run-seed.mjs                # Executa seed
├── postbuild-db.mjs            # Setup pós-build
├── check-migrations.mjs        # Verifica migrações pendentes
├── fix-esbuild-permissions.mjs # Fix permissões esbuild
└── smoke-test-api.mjs          # Testes de smoke da API
```

## Outros Diretórios

### `db/`
```
db/
└── index.ts                    # Pool de conexão (legacy)
```

### `migrations/`
```
migrations/
├── 0000_*.sql                  # Migrations SQL
├── 0001_*.sql
└── meta/                       # Metadados Drizzle
    ├── _journal.json
    └── 0000_snapshot.json
```

### `attached_assets/`
Assets estáticos uploadados, servidos em `/assets`.

### `public/uploads/`
Imagens de produtos e serviços, servidas em `/uploads`.

## Arquivos de Configuração

| Arquivo | Propósito |
|---------|-----------|
| `package.json` | Dependências e scripts npm |
| `tsconfig.json` | Config TS raiz |
| `tsconfig.base.json` | Config TS base compartilhada |
| `vite.config.ts` | Configuração Vite |
| `drizzle.config.ts` | Configuração Drizzle Kit |
| `components.json` | Configuração shadcn/ui |
| `.env` | Variáveis de ambiente (não versionado) |

## Fluxo de Imports

```
frontend/features/* 
    → frontend/shared/*
    → shared/contracts/*

backend/api/routes/*
    → backend/services/*
    → backend/infrastructure/*
    → shared/contracts/*
    → shared/schema.ts
```

## Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Diretórios | kebab-case | `products-management/` |
| Componentes React | PascalCase | `ProductCard.tsx` |
| Hooks | camelCase com prefixo | `use-mobile.tsx` |
| Rotas backend | kebab-case + .routes | `products.routes.ts` |
| Services | kebab-case + .service | `checkout.service.ts` |
| Tipos | PascalCase | `CheckoutData` |
| Schemas Zod | camelCase + Schema | `checkoutSchema` |
