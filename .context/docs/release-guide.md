# Guia de Release - Arquitetura Modular

**Versão**: 2.0.0 (Refatoração Modular)
**Data**: 2026-02-13

## Resumo das Mudanças

Esta release implementa uma refatoração completa da arquitetura do projeto, migrando de uma estrutura monolítica para uma arquitetura modular com separação clara entre frontend e backend.

### Principais Mudanças

1. **Estrutura de Diretórios**
   - `client/` → `frontend/`
   - `server/` → mantido para infraestrutura, lógica de negócio em `backend/`
   - Novo diretório `backend/` com API modular
   - `shared/contracts/` para tipos compartilhados (frontend-safe)

2. **Frontend**
   - Reorganizado em features modulares (`frontend/features/`)
   - `admin.tsx` decomposto em múltiplos componentes
   - Imports centralizados via `@shared/contracts`
   - API base configurável via `VITE_API_BASE`

3. **Backend**
   - Rotas divididas por domínio (`backend/api/routes/`)
   - Services extraídos (`backend/services/`)
   - Middlewares centralizados (`backend/api/middleware/`)
   - Auth utils em serviço dedicado

4. **TypeScript**
   - Configurações separadas por workspace
   - `tsconfig.base.json` com opções compartilhadas
   - Fronteiras de módulo enforçadas

---

## Checklist de Pre-Deploy

### Backup

- [ ] Backup do banco de dados MySQL
  ```bash
  mysqldump -u root -p moto_detalhamento > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Backup dos arquivos de upload (`public/uploads/`)
- [ ] Tag da versão anterior no git
  ```bash
  git tag -a v1.x.x-pre-modular -m "Última versão antes da refatoração modular"
  git push origin v1.x.x-pre-modular
  ```
- [ ] Notificar equipe sobre deploy

### Verificações

- [ ] Todas as variáveis de ambiente configuradas
- [ ] `SESSION_SECRET` definido para produção
- [ ] Credenciais de banco de dados corretas
- [ ] Stripe keys configuradas (se usando pagamentos)
- [ ] Resend API key configurada (se usando emails)

---

## Processo de Deploy

### 1. Preparação

```bash
# Pull da branch principal
git pull origin main

# Verificar se está na versão correta
git log -1 --oneline
```

### 2. Instalação de Dependências

```bash
npm install
```

### 3. Build

```bash
npm run build
```

Este comando executa:
- Verificação de migrations
- Build do frontend (Vite)
- Build do backend (esbuild)
- Cópia de migrations para dist/
- Aplicação de migrations no banco

### 4. Verificação Pós-Build

```bash
# Verificar arquivos gerados
ls dist/
ls dist/public/

# Verificar tamanho do bundle
# O build mostra: "Server bundle size: ~60 KB"
```

### 5. Iniciar Servidor

```bash
# Produção (requer SESSION_SECRET)
npm run start

# Ou com variáveis de ambiente
SESSION_SECRET=seu_secret_aqui npm run start
```

### 6. Verificação Pós-Deploy

```bash
# Health check
curl http://localhost:5000/api/health

# Smoke tests
node scripts/smoke-test-api.mjs
```

---

## Checklist de Validação Pós-Deploy

### API

- [ ] Health check retorna `{ status: "healthy" }`
- [ ] `/api/products` retorna lista de produtos
- [ ] `/api/settings` retorna configurações do site

### Frontend

- [ ] Página inicial carrega corretamente
- [ ] Navegação entre páginas funciona
- [ ] Imagens e assets carregam

### Admin

- [ ] Login admin funciona
- [ ] Dashboard carrega dados
- [ ] CRUD de produtos funciona
- [ ] Upload de imagens funciona

### Cliente

- [ ] Login cliente funciona
- [ ] Carrinho funciona
- [ ] Checkout funciona (WhatsApp ou Stripe)

---

## Plano de Rollback

### Se algo der errado:

#### 1. Identificar o Problema

```bash
# Verificar logs do servidor
# Em produção, verificar logs do PM2 ou similar

# Verificar health check
curl http://localhost:5000/api/health
```

#### 2. Rollback Rápido (código)

```bash
# Reverter para tag anterior
git checkout v1.x.x-pre-modular

# Reinstalar dependências
npm install

# Rebuild
npm run build

# Restart servidor
npm run start
```

#### 3. Rollback de Banco (se necessário)

```bash
# Restaurar backup
mysql -u root -p moto_detalhamento < backup_YYYYMMDD_HHMMSS.sql
```

### Pontos de Não-Retorno

⚠️ **Atenção**: Os seguintes cenários requerem restore de backup:

- Migrations que alteram estrutura de tabelas
- Mudanças em dados de produção
- Exclusão de registros

---

## Breaking Changes

### Para Desenvolvedores

1. **Imports de tipos**
   - Antes: `import { User } from '@shared/schema'`
   - Depois: `import type { User } from '@shared/contracts'`

2. **Estrutura de diretórios**
   - Frontend: `frontend/src/` (antes: `client/src/`)
   - Backend API: `backend/api/routes/` (antes: `server/routes.ts`)

3. **Configuração TypeScript**
   - Usar `tsconfig.base.json` como base
   - Configs específicos em `frontend/tsconfig.json` e `backend/tsconfig.json`

### Para Operações

1. **Entry point do servidor**
   - Produção: `dist/index.js` (sem mudança)
   - Desenvolvimento: `npm run dev` usa `backend/api/index.ts`

2. **Scripts movidos**
   - De `script/` para `scripts/`

---

## Monitoramento Pós-Deploy

### Primeiros 30 minutos

- [ ] Monitorar logs de erro
- [ ] Verificar uso de memória
- [ ] Verificar tempo de resposta das APIs

### Métricas a Observar

- Tempo de resposta do health check (< 500ms)
- Erros 5xx no log
- Uso de memória do processo Node.js

---

## Contatos

Em caso de problemas críticos durante o deploy:

- Verificar documentação em `.context/docs/`
- Consultar `STATUS.md` para histórico da refatoração
- Revisar `PRD-refector-modular.md` para decisões arquiteturais

---

## Histórico de Versões

| Versão | Data | Descrição |
|--------|------|-----------|
| 2.0.0 | 2026-02-13 | Refatoração modular completa |
