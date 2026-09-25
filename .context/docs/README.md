# Documentation Index

Welcome to the repository knowledge base. Start with the project overview, then dive into specific guides as needed.

## Core Guides
- [Project Overview](./project-overview.md)
- [Project Structure](./project-structure.md)
- [Architecture Notes](./architecture.md)
- [Runtime Env & Deploy Notes](../../README.md#deploy-na-hostinger)
- [Assets Strategy](./assets-strategy.md)
- [Development Workflow](./development-workflow.md)
- [Testing Strategy](./testing-strategy.md)
- [Glossary & Domain Concepts](./glossary.md)
- [Data Flow & Integrations](./data-flow.md)
- [Checkout por WhatsApp](./whatsapp-checkout.md)
- [Checkout autenticado e pedidos persistentes](./checkout-auth-orders.md)
- [Identificação dos itens de pedido](#identificação-dos-itens-de-pedido)
- [Dados fiscais no pedido](./customer-fiscal-order-modal.md)
- [Agenda operacional administrativa](#agenda-operacional-administrativa)
- [Controle informativo de pagamento na agenda](./appointment-payment.md)
- [Adendo WFOY — armazenamento atual do documento](../../_reversa_sdd/addenda/bug-BUG-20260901-WFOY-v001.md)
- [Security & Compliance Notes](./security.md)
- [Tooling & Productivity Guide](./tooling.md)
- [Boundary Rules](./boundary-rules.md)
- [Release Guide](./release-guide.md)

## Repository Snapshot (Arquitetura Modular)

### Frontend (`frontend/`)
- `frontend/app/` — Bootstrap da aplicação (App.tsx, main.tsx)
- `frontend/features/` — Features modulares por domínio
  - `admin/` — Painel administrativo, incluindo a Agenda operacional
  - `auth/` — Autenticação
  - `cart/` — Carrinho de compras
  - `checkout/` — Fluxo de checkout
  - `products/` — Catálogo de produtos
  - `account/` — Área do cliente
  - `home/` — Página inicial
- `frontend/shared/` — UI, hooks, lib compartilhados
- `frontend/pages/` — Páginas genéricas (404)

### Backend (`backend/`)
- `backend/api/` — API Express (routes, middleware)
  - Startup includes safe env diagnostics and `.env` fallback loading before route registration.
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

## Catálogo e listagens de produtos (client-side)

Filtros, ordenação e paginação rodam no frontend após carregar a lista completa da API (sem query params de paginação no backend).

| Área | Arquivo | Capacidades |
| --- | --- | --- |
| Loja pública | `frontend/features/products/pages/produtos.tsx` | Busca (nome/descrição), filtro de categoria, ordenação (rating, preço asc/desc, nome A–Z/Z–A), **12 itens/página**, `PaginationControls` |
| Admin produtos | `frontend/features/admin/pages/products-management.tsx` | Busca (nome/descrição/categoria), filtro status (todos/ativos/desativados), ordenação (inativos primeiro + nome A–Z/Z–A), **10 itens/página**, `PaginationControls` |
| Componente compartilhado | `frontend/shared/components/PaginationControls.tsx` | Paginação controlada reutilizável (admin, loja, futuras telas) |
| Select longo | `frontend/shared/ui/select.tsx` | Scroll em dropdowns com muitos itens (ex.: categorias na loja) |

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

## Agenda operacional administrativa

A agenda de serviços existe somente no painel administrativo, na aba **Agenda**; `/agendar`, o formulário público e a consulta por cliente foram removidos. O Dashboard mantém apenas os contadores operacionais e os próximos cinco agendamentos.

`appointments` armazena contato, moto, início, fim previsto, término real, status, total decimal, arquivamento e os metadados do orçamento vigente. `appointment_items` preserva os snapshots de nome, descrição, duração e valor de cada serviço. O backend soma duração e valores, preenche o término real ao concluir e detecta sobreposição contra todos os registros não cancelados e não arquivados. Um conflito retorna `409/SCHEDULE_CONFLICT` e pode ser confirmado com `allowConflict`.

A interface permite iniciar um agendamento pelo clique em qualquer dia do calendário. Cada agendamento aceita múltiplos serviços por meio de um editor modal: o administrador pode buscar um serviço ativo do catálogo, preservando seu snapshot, ou cadastrar um serviço avulso com nome, descrição, duração e valor válidos somente para aquele agendamento. A tela principal exibe os itens em uma lista compacta, com edição, remoção e bloqueio de duplicidade para serviços do catálogo. O contato avulso usa máscara e validação de telefone brasileiro, validação de e-mail e feedback visual junto aos campos inválidos.

As rotas `GET`, `POST` e `PATCH /api/appointments`, resumo, arquivamento/restauração e orçamento exigem `requireAdmin`. Datas persistem em UTC e são exibidas em `America/Sao_Paulo`. Valores de agenda trafegam como strings decimais.

Orçamentos podem ser gerados como `ORC-<id>` ou enviados em PDF, JPEG, PNG e WebP, até 10 MB. Eles ficam fora da pasta pública, possuem nomes internos aleatórios e download autenticado. Produção exige `PRIVATE_UPLOADS_DIR`; desenvolvimento usa `backend/.runtime/appointment-budgets/`. A substituição do documento vigente requer confirmação explícita.

A migração `0006_admin_operational_appointments.sql` define 60 minutos nos serviços existentes, converte datas e preços legados, mapeia `pre_agendamento` para `agendado_nao_iniciado` e cria um item legado por registro. A planilha de referência não é importada.

## Notificações administrativas de pedidos

Novos pedidos geram uma notificação persistente para a equipe administrativa. O painel assina `GET /api/admin/notifications/stream` via Server-Sent Events e exibe imediatamente o alerta na barra superior, com atalho para abrir o pedido. As notificações também são carregadas por `GET /api/admin/notifications`, permitindo recuperar eventos enquanto o painel estava fechado ou sem conexão. Cada item pode ser marcado como lido individualmente ou em lote; a notificação é deduplicada por pedido e tipo.

## Identificação dos itens de pedido

A revisão do checkout, a confirmação do pagamento, o histórico do cliente, Pedidos e Dashboard administrativos exibem o nome do produto com iniciais maiúsculas e espaços normalizados. O rótulo da variação escolhida aparece entre parênteses com a grafia cadastrada, por exemplo `Interiores 1 Lt Cadillac (500 ML)`.

O formatador `frontend/shared/lib/formatters.ts` altera somente a apresentação. Os snapshots `product_name`, `variation_id` e `variation_label` do pedido permanecem intactos. Pedidos antigos sem `variation_label` continuam mostrando o nome salvo, sem consultar o catálogo para inferir a variação.
