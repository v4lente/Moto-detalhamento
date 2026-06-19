# Bugs Tracker

**Última atualização:** 2026-06-18

## Baseline automático (2026-06-18)

| Comando | Resultado | Notas |
|---------|-----------|-------|
| `npm run check` | PASS | TypeScript sem erros |
| `npm run build` | PASS | Após fix de `postbuild` |
| `npm run test` | PASS (6/6) | Após `npx playwright install chromium` |
| `node scripts/smoke-test-api.mjs` | BLOCKED | Requer servidor + DATABASE_URL |

### Ambiente local

- Node v20.17.0 (package.json exige >=20.19.0 — warning EBADENGINE)
- `.env` criado localmente com `SESSION_SECRET` (não commitado)
- `DATABASE_URL` não configurada — API de dados retorna 500

---

## Bugs encontrados e status

### BUG-001 — `postbuild`/`start` falham sem Node 20.19+

**Severidade:** Alta  
**Descrição:** `node --env-file-if-exists=.env` não existe em Node 20.17; `npm run build` falhava no postbuild e `npm start` crashava.  
**Status:** FIXED  
**Fix:** Removido flag; `scripts/load-env-if-exists.mjs` + carga em `postbuild-db.mjs`; `start` usa `node dist/index.js` (app carrega `.env` no bootstrap).

### BUG-002 — `npm start` crash sem SESSION_SECRET

**Severidade:** Alta  
**Descrição:** Bundle define `NODE_ENV=production` em build time; exige `SESSION_SECRET` mesmo sem `.env`.  
**Status:** FIXED (operacional)  
**Fix:** `.env` local com `SESSION_SECRET`; app já carrega `.env` via `loadEnvironmentFallbackFromDotEnv`.

### BUG-003 — Health check TypeError quando DB indisponível

**Severidade:** Média  
**Descrição:** `/api/health` chamava `storage.getSiteSettings()` com `db=null`, gerando `Cannot read properties of null (reading 'select')`.  
**Status:** FIXED  
**Fix:** `health.routes.ts` verifica `isDatabaseAvailable` antes da query.

### BUG-004 — Storage crash com TypeError quando DATABASE_URL ausente

**Severidade:** Alta  
**Descrição:** Todas as rotas que usam storage falhavam com TypeError em vez de erro estruturado.  
**Status:** FIXED  
**Fix:** Proxy guard em `db/index.ts` que lança `DatabaseUnavailableError`.

### BUG-005 — Playwright browsers não instalados após `npm install`

**Severidade:** Média  
**Descrição:** Testes E2E falham até `npx playwright install`.  
**Status:** OPEN (documentado)  
**Ação:** Considerar `postinstall` ou nota em README/AGENTS.md.

### BUG-006 — Teste `/api/health` aceita qualquer 2xx–5xx

**Severidade:** Baixa  
**Descrição:** `tests/build.spec.ts` não detecta API degradada (503).  
**Status:** FIXED  
**Fix:** Health test valida JSON estruturado; `tests/api-degraded.spec.ts` cobre modo sem DB.

### BUG-007 — Documentação/agents desatualizados

**Severidade:** Baixa  
**Status:** FIXED (parcial)  
**Fix:** `testing-strategy.md`, `AGENTS.md`, `bug-fixer.md`, skill `bug-investigation` atualizados.

### BUG-008 — `.env` carregado após init do pool MySQL

**Severidade:** Alta  
**Descrição:** `DATABASE_URL` em `.env` não era lida antes de `db/index.ts` criar o pool.  
**Status:** FIXED  
**Fix:** `loadEnvIfExists()` em `backend/infrastructure/load-env.ts`, chamado no topo de `db/index.ts`.

---

## Checklist manual F4-T4 (sem DATABASE_URL)

| Área | Teste | Resultado |
|------|-------|-----------|
| Frontend | Home carrega HTML estático | PASS (Playwright) |
| Frontend | Produtos/checkout | BLOCKED (API 500 sem DB) |
| Frontend | Login cliente | BLOCKED (sem DB) |
| Admin | CRUD | BLOCKED (sem DB) |
| API | `/api/health` sem DB | 503 `unhealthy` (esperado) |
| API | `/api/products` sem DB | 500 (erro estruturado após BUG-004) |
| API | `/api/settings` sem DB | 500 (erro estruturado após BUG-004) |

**Próximo passo:** Configurar `DATABASE_URL` no `.env` e reexecutar smoke tests + checklist manual completo.

---

## Lista do usuário

Pendente — usuário indicou que compartilhará bugs específicos. Bugs acima foram descobertos no baseline.
