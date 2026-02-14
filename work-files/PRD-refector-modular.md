# PRD - Refactor Modular (frontend/backend)

## Objetivo
Refatorar o codebase para uma arquitetura modular com separacao explicita entre `frontend/` e `backend/`, reduzindo acoplamento entre camadas e aumentando clareza estrutural sem interromper build, execucao e testes.

## Escopo
- Separacao estrutural de diretorios e responsabilidades.
- Modularizacao interna do frontend por features.
- Modularizacao interna do backend por dominios/servicos.
- Ajustes de tooling (build, scripts, aliases, migrations).
- Atualizacao de documentacao e padroes de governanca.

## Fora de escopo
- Reescrita funcional completa de regras de negocio.
- Mudanca de stack (React/Express/Drizzle).
- Mudanca de banco ou provedor de deploy.
- Implementacao de DDD completo (domain layer reservado para futuro se necessario).

## Arquitetura alvo

### Estrutura de diretorios
```
frontend/
  app/              # Bootstrap, roteamento principal
  features/         # Modulos por dominio de negocio
  shared/           # UI components, hooks, utils compartilhados
  infrastructure/   # Config de API, env vars

backend/
  api/              # Rotas HTTP e middlewares
  services/         # Logica de negocio extraida (onde houver complexidade)
  infrastructure/   # DB, email, stripe, storage

shared/contracts/
  types.ts          # Tipos TypeScript puros (sem ORM)
  validation.ts     # Schemas Zod compartilhados
```

### Decisoes arquiteturais
- **Backend simplificado**: Repository Pattern via `IStorage` e suficiente para o porte atual. Camada `domain/` reservada para crescimento futuro.
- **Frontend feature-oriented**: Organizacao por features facilita manutencao e escalabilidade.
- **Contratos desacoplados**: Frontend nao importa Drizzle ORM, apenas tipos e validacoes.

---

## Indice de Tasks

### Fase 0 - Baseline e Validacao Pre-Migracao
| Task | Arquivo | Status |
|------|---------|--------|
| F0-T1 | [F0-T1-baseline-tecnico.md](./F0-T1-baseline-tecnico.md) | pendente |
| F0-T2 | [F0-T2-smoke-tests-api.md](./F0-T2-smoke-tests-api.md) | pendente |
| F0-T3 | [F0-T3-documentar-estado-atual.md](./F0-T3-documentar-estado-atual.md) | pendente |

### Fase 1 - Estabilizacao de Fronteiras
| Task | Arquivo | Status |
|------|---------|--------|
| F1-T1 | [F1-T1-criar-estrutura-diretorios.md](./F1-T1-criar-estrutura-diretorios.md) | pendente |
| F1-T2 | [F1-T2-split-tsconfig.md](./F1-T2-split-tsconfig.md) | pendente |
| F1-T3 | [F1-T3-split-schema.md](./F1-T3-split-schema.md) | pendente |
| F1-T4 | [F1-T4-migrar-imports-frontend.md](./F1-T4-migrar-imports-frontend.md) | pendente |
| F1-T5 | [F1-T5-centralizar-api-base.md](./F1-T5-centralizar-api-base.md) | pendente |
| F1-T6 | [F1-T6-validar-desacoplamento.md](./F1-T6-validar-desacoplamento.md) | pendente |

### Fase 2 - Migracao do Frontend
| Task | Arquivo | Status |
|------|---------|--------|
| F2-T1 | [F2-T1-mover-client-frontend.md](./F2-T1-mover-client-frontend.md) | pendente |
| F2-T2 | [F2-T2-atualizar-configs-build.md](./F2-T2-atualizar-configs-build.md) | pendente |
| F2-T3 | [F2-T3-atualizar-dev-server.md](./F2-T3-atualizar-dev-server.md) | pendente |
| F2-T4 | [F2-T4-atualizar-tsconfig-frontend.md](./F2-T4-atualizar-tsconfig-frontend.md) | pendente |
| F2-T5 | [F2-T5-reorganizar-frontend-features.md](./F2-T5-reorganizar-frontend-features.md) | pendente |
| F2-T5a | [F2-T5a-decompor-admin-tsx.md](./F2-T5a-decompor-admin-tsx.md) | pendente |
| F2-T6 | [F2-T6-validar-frontend.md](./F2-T6-validar-frontend.md) | pendente |

### Fase 3 - Migracao do Backend
| Task | Arquivo | Status |
|------|---------|--------|
| F3-T1 | [F3-T1-mover-server-backend.md](./F3-T1-mover-server-backend.md) | pendente |
| F3-T2 | [F3-T2-mover-db-backend.md](./F3-T2-mover-db-backend.md) | pendente |
| F3-T3 | [F3-T3-consolidar-scripts.md](./F3-T3-consolidar-scripts.md) | pendente |
| F3-T4 | [F3-T4-atualizar-configs-entrypoints.md](./F3-T4-atualizar-configs-entrypoints.md) | pendente |
| F3-T5 | [F3-T5-extrair-auth-utils.md](./F3-T5-extrair-auth-utils.md) | pendente |
| F3-T6 | [F3-T6-split-routes.md](./F3-T6-split-routes.md) | pendente |
| F3-T7 | [F3-T7-extrair-services.md](./F3-T7-extrair-services.md) | pendente |
| F3-T8 | [F3-T8-estrategia-assets.md](./F3-T8-estrategia-assets.md) | pendente |
| F3-T9 | [F3-T9-validar-backend.md](./F3-T9-validar-backend.md) | pendente |

### Fase 4 - Limpeza e Hardening
| Task | Arquivo | Status |
|------|---------|--------|
| F4-T1 | [F4-T1-remover-legado.md](./F4-T1-remover-legado.md) | pendente |
| F4-T2 | [F4-T2-regras-fronteira.md](./F4-T2-regras-fronteira.md) | pendente |
| F4-T3 | [F4-T3-atualizar-docs.md](./F4-T3-atualizar-docs.md) | pendente |
| F4-T4 | [F4-T4-regressao-final.md](./F4-T4-regressao-final.md) | pendente |
| F4-T5 | [F4-T5-checklist-release.md](./F4-T5-checklist-release.md) | pendente |

---

## Analise de Paralelismo

### Onda 0 - Baseline (Sequencial)
- **Sequencial obrigatorio**: `F0-T1` -> `F0-T2` -> `F0-T3`

### Onda A - Estabilizacao (Fase 1)
- **Paralelo**: `F1-T1`, `F1-T2`, `F1-T3` podem rodar em paralelo
- **Paralelo**: `F1-T4` e `F1-T5` podem rodar em paralelo (apos F1-T3)
- **Bloqueio**: `F1-T6` consolida tudo no fim

### Onda B - Frontend (Fase 2)
- **Paralelo**: `F2-T2`, `F2-T3`, `F2-T4` podem rodar em paralelo (apos F2-T1)
- **Paralelo**: `F2-T5` e `F2-T5a` podem rodar em paralelo
- **Bloqueio**: `F2-T6` consolida tudo no fim
- **IMPORTANTE**: Fase 2 deve completar antes de Fase 3

### Onda C - Backend (Fase 3)
- **Paralelo**: `F3-T1` e `F3-T2` podem rodar em paralelo
- **Paralelo**: `F3-T3`, `F3-T4` podem rodar em paralelo (apos F3-T1/T2)
- **Paralelo**: `F3-T6` pode ser dividida por dominio
- **Bloqueio**: `F3-T9` consolida tudo no fim

### Onda D - Fechamento (Fase 4)
- **Paralelo**: `F4-T2` e `F4-T3` podem rodar em paralelo
- **Paralelo**: `F4-T4` e `F4-T5` podem rodar em paralelo
- **Bloqueio**: `F4-T4` so apos `F4-T1`, `F4-T2`, `F4-T3`

---

## Criterios de Aceite

### Tecnicos
- [ ] Diretorios `frontend/` e `backend/` com ownership claro
- [ ] Frontend sem dependencia de `drizzle-orm` no bundle
- [ ] Backend com rotas modularizadas por dominio (9 arquivos)
- [ ] `admin.tsx` decomposto em pelo menos 6 paginas modulares
- [ ] Scripts de build/dev/db funcionais

### Arquiteturais
- [ ] `shared/contracts/` contem apenas tipos e validacoes
- [ ] Frontend nao importa nada de `backend/`
- [ ] Backend nao importa nada de `frontend/`

### Documentacao
- [ ] `README.md` atualizado
- [ ] `AGENTS.md` atualizado
- [ ] `.context/docs/` atualizado

---

## Estimativa de Esforco

| Fase | Tasks | Estimativa |
|------|-------|------------|
| Fase 0 | 3 | 2-4 horas |
| Fase 1 | 6 | 1-2 dias |
| Fase 2 | 7 | 3-5 dias |
| Fase 3 | 9 | 4-6 dias |
| Fase 4 | 5 | 1-2 dias |
| **Total** | **30** | **9-19 dias** |
