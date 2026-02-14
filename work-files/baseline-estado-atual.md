# Baseline - Estado Atual do Codebase

**Data**: 2026-02-13
**Gerado por**: Agent

## Estrutura de Diretorios Atual

```
Moto-detalhamento/
├── client/                 # Frontend React
│   └── src/
│       ├── components/     # Componentes reutilizaveis
│       ├── hooks/          # Custom hooks
│       ├── lib/            # Utilitarios e API
│       └── pages/          # Paginas da aplicacao
├── server/                 # Backend Express
│   ├── index.ts           # Entry point
│   ├── routes.ts          # Todas as rotas (monolitico)
│   ├── storage.ts         # Camada de dados
│   ├── vite.ts            # Middleware Vite dev
│   ├── static.ts          # Servir arquivos estaticos
│   ├── email.ts           # Servico de email
│   └── stripe.ts          # Integracao Stripe
├── shared/                 # Codigo compartilhado
│   └── schema.ts          # Schemas Drizzle + Zod
├── db/                     # Configuracao do banco
│   └── index.ts           # Conexao Drizzle
├── migrations/             # Migrations SQL
├── public/                 # Assets publicos
├── attached_assets/        # Assets anexados
├── scripts/                # Scripts utilitarios
├── script/                 # Scripts de build
└── tests/                  # Testes Playwright
```

## Arquivos Criticos

| Arquivo | Linhas | Complexidade | Notas |
|---------|--------|--------------|-------|
| `client/src/pages/admin.tsx` | 2574 | Alta | Monolitico, precisa decomposicao |
| `server/routes.ts` | 1463 | Alta | Todas as rotas em um arquivo |
| `shared/schema.ts` | 367 | Media | Schemas Drizzle + Zod misturados |

## Imports de @shared/schema no Frontend

Arquivos que importam de `@shared/schema`:

| Arquivo | Tipos Importados |
|---------|------------------|
| `client/src/lib/api.ts` | Tipos para API client |
| `client/src/lib/cart.tsx` | Tipos de produto/carrinho |
| `client/src/pages/home.tsx` | Tipos de produto |
| `client/src/pages/admin.tsx` | Multiplos tipos (admin) |
| `client/src/pages/produto.tsx` | Tipos de produto |
| `client/src/pages/produtos.tsx` | Tipos de produto |
| `client/src/pages/conta.tsx` | Tipos de cliente |
| `client/src/components/product-card.tsx` | Tipos de produto |

**Total**: 8 arquivos importam de `@shared/schema`

## Referencias a Paths Hardcoded

Arquivos com referencias a `/api/`:

| Arquivo | Contexto |
|---------|----------|
| `client/src/lib/stripe.ts` | Chamadas API Stripe |
| `client/src/hooks/use-upload.ts` | Upload de arquivos |
| `client/src/components/ImageUpload.tsx` | Upload de imagens |

## Dependencias Criticas

### Frontend -> Backend
- Frontend usa `@shared/schema` para tipos
- Frontend faz chamadas para `/api/*` endpoints
- Frontend depende de Vite para dev server

### Backend -> Shared
- Backend importa schemas Drizzle de `@shared/schema`
- Backend usa validacoes Zod de `@shared/schema`

### Problemas Identificados
1. **Acoplamento forte**: Frontend importa tipos que incluem Drizzle ORM
2. **Monolitismo**: `admin.tsx` e `routes.ts` sao muito grandes
3. **Falta de separacao**: Schemas de banco e validacoes no mesmo arquivo

## Configuracoes Atuais

### tsconfig.json
- Aliases: `@/` -> `client/src/`, `@shared/` -> `shared/`, `@assets/` -> `attached_assets/`

### vite.config.ts
- Root: `client/`
- Build output: `dist/public/`
- Aliases configurados

### package.json Scripts
- `dev`: Servidor de desenvolvimento
- `build`: Build de producao
- `check`: TypeScript check
- `test`: Playwright tests
- `db:*`: Scripts de banco de dados

## Metricas de Baseline

| Metrica | Valor |
|---------|-------|
| Total de arquivos TypeScript | ~50 |
| Linhas de codigo (estimado) | ~15000 |
| Endpoints API | ~40 |
| Componentes React | ~30 |
| Testes Playwright | 6 |

## Conclusao

O codebase esta funcional mas com alto acoplamento entre frontend e backend atraves do `@shared/schema`. A refatoracao deve:

1. Separar tipos puros de schemas Drizzle
2. Decompor arquivos monoliticos
3. Criar estrutura de diretorios clara
4. Manter compatibilidade durante migracao
