# F2-T6 - Validar Frontend

## Metadata
- **ID**: F2-T6
- **Fase**: 2 - Migracao do Frontend
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Validar que todas as mudancas da Fase 2 estao funcionando corretamente.

## Checklist
- [ ] Corrigir imports quebrados
- [ ] Executar `npm run dev:client` e verificar HMR
- [ ] Executar `npm run dev` e verificar integracao com backend
- [ ] Executar `npm run build` e verificar output
- [ ] Smoke test de rotas principais
- [ ] Teste manual de navegacao

## Testes de Navegacao
- [ ] Home -> Produtos -> Produto -> Checkout
- [ ] Login -> Conta -> Historico de Pedidos
- [ ] Admin -> Dashboard -> Produtos -> Pedidos -> Clientes
- [ ] Admin -> Agendamentos -> Servicos -> Configuracoes

## Comandos de Validacao
```bash
# Dev client only
npm run dev:client

# Dev completo (client + server)
npm run dev

# Build
npm run build

# Smoke tests
node scripts/smoke-test-api.mjs
```

## Criterio de Aceite
- Todos os comandos passam
- HMR funcionando
- Navegacao entre paginas funcionando
- Admin decomposto funcionando
- Build gera output correto

## Dependencias
- F2-T2, F2-T3, F2-T4, F2-T5, F2-T5a (todas as tasks da Fase 2)

## Bloqueia
- Fase 3 inteira (nao iniciar Fase 3 sem esta validacao)

## Notas
- Esta task e o checkpoint da Fase 2
- Se falhar, corrigir antes de prosseguir para Fase 3

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
