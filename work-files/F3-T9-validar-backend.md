# F3-T9 - Validar Backend Modular

## Metadata
- **ID**: F3-T9
- **Fase**: 3 - Migracao do Backend
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Validar que todas as mudancas da Fase 3 estao funcionando corretamente.

## Checklist
- [ ] Executar `npm run dev` e verificar servidor iniciando
- [ ] Executar `npm run build` e verificar `dist/index.js`
- [ ] Executar `npm run db:migrate` e verificar migrations
- [ ] Executar smoke tests de API
- [ ] Verificar frontend funcionando com backend modular
- [ ] Teste manual de APIs criticas

## Comandos de Validacao
```bash
# Dev server
npm run dev

# Build
npm run build

# Start production
npm run start

# Migrations
npm run db:migrate

# Smoke tests
node scripts/smoke-test-api.mjs
```

## Testes de API
- [ ] GET `/api/products` - Lista produtos
- [ ] GET `/api/settings` - Configuracoes
- [ ] POST `/api/auth/login` - Login admin
- [ ] POST `/api/customer/login` - Login customer
- [ ] GET `/api/orders` - Lista pedidos (autenticado)
- [ ] GET `/api/appointments` - Lista agendamentos

## Criterio de Aceite
- Todos os comandos passam
- Servidor inicia sem erros
- Build gera output correto
- Migrations funcionam
- Smoke tests passam
- Frontend funciona com backend modular

## Dependencias
- F3-T4, F3-T6, F3-T7, F3-T8 (todas as tasks da Fase 3)

## Bloqueia
- Fase 4 inteira (nao iniciar Fase 4 sem esta validacao)

## Notas
- Esta task e o checkpoint da Fase 3
- Se falhar, corrigir antes de prosseguir

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
