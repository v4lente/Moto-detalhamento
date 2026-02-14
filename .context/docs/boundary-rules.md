# Boundary Rules

Este documento define as regras de fronteira entre os módulos do projeto, garantindo separação clara de responsabilidades e prevenindo acoplamento indevido.

## Visão Geral

O projeto segue uma arquitetura de monolito modular com três zonas principais:

```
┌─────────────────────────────────────────────────────────────┐
│                        frontend/                            │
│  (React, UI components, pages, hooks)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ imports via HTTP/API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    shared/contracts/                        │
│  (Types, Zod schemas, API contracts)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ imports diretos
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        backend/                             │
│  (Express, routes, storage, services)                       │
└─────────────────────────────────────────────────────────────┘
```

## Regras de Importação

### Frontend (`frontend/`)

#### Pode importar de:
- `frontend/**/*` - Próprio código (componentes, hooks, utils)
- `shared/contracts/**/*` - Tipos e validações compartilhadas
- `node_modules/**/*` - Dependências externas

#### NÃO pode importar de:
- `backend/**/*` - Código do servidor
- `shared/schema.ts` - ORM/Drizzle (usar apenas types via contracts)

**Justificativa**: O frontend deve ser completamente desacoplado do backend, comunicando-se apenas via API HTTP. Importar código do backend criaria dependências de runtime impossíveis de executar no browser.

### Backend (`backend/`)

#### Pode importar de:
- `backend/**/*` - Próprio código (routes, storage, services)
- `shared/**/*` - Schema ORM e contracts
- `node_modules/**/*` - Dependências externas

#### NÃO pode importar de:
- `frontend/**/*` - Código do cliente

**Exceção**: O arquivo de integração dev-server (`backend/vite.ts`) pode importar configurações do Vite para servir o frontend em desenvolvimento.

**Justificativa**: O backend não deve ter conhecimento da implementação do frontend. A comunicação deve ser via API contracts bem definidos.

### Shared (`shared/`)

#### Estrutura:
- `shared/contracts/` - Types, Zod schemas, API contracts (usado por frontend e backend)
- `shared/schema.ts` - Drizzle ORM schema (usado apenas pelo backend)

#### Pode importar de:
- `shared/**/*` - Próprio código
- `node_modules/**/*` - Dependências (Zod, Drizzle)

#### NÃO pode importar de:
- `frontend/**/*`
- `backend/**/*`

## Validação

### Comandos de Verificação

Para verificar imports inválidos no frontend:

```powershell
# Buscar imports de backend/
rg "backend/" --type ts --type tsx frontend/

# Buscar imports de shared/schema
rg "shared/schema" --type ts --type tsx frontend/
```

Para verificar imports inválidos no backend:

```powershell
# Buscar imports de frontend/
rg "frontend/" --type ts --type tsx backend/
```

### Verificação de Tipos

```powershell
npm run check
```

O TypeScript compiler (`tsc`) validará que todos os imports são resolvíveis e que os tipos estão corretos.

## Consequências de Violação

Violações das regras de fronteira podem causar:

1. **Erros de build** - Imports de módulos Node.js no frontend falharão no bundler
2. **Circular dependencies** - Acoplamento bidirecional dificulta manutenção
3. **Type leakage** - Tipos internos expostos incorretamente
4. **Runtime errors** - Código de servidor executado no browser

## Checklist para Code Review

- [ ] Frontend não importa de `backend/`
- [ ] Frontend não importa de `shared/schema.ts` diretamente
- [ ] Backend não importa de `frontend/`
- [ ] Novos types compartilhados estão em `shared/contracts/`
- [ ] `npm run check` passa sem erros

## Histórico de Validação

| Data | Resultado | Observações |
|------|-----------|-------------|
| 2026-02-13 | ✅ Aprovado | Nenhum import inválido encontrado. Compilação OK. |

## Referências

- [Architecture](./architecture.md) - Visão geral da arquitetura
- [Data Flow](./data-flow.md) - Fluxo de dados entre módulos
