# F4-T4 - Executar Regressao Final Completa

## Metadata
- **ID**: F4-T4
- **Fase**: 4 - Limpeza e Hardening
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Executar regressao final completa para validar toda a migracao.

## Checklist
- [ ] Executar `npm run check` (TypeScript)
- [ ] Executar `npm run build` (build completo)
- [ ] Executar `npm run test` (Playwright e2e)
- [ ] Executar smoke tests de API
- [ ] Teste manual de fluxos principais

## Comandos de Validacao
```bash
# TypeScript check
npm run check

# Build completo
npm run build

# Testes e2e
npm run test

# Smoke tests
node scripts/smoke-test-api.mjs
```

## Testes Manuais

### Frontend
- [ ] Home -> Produtos -> Produto -> Checkout
- [ ] Login cliente -> Conta -> Historico
- [ ] Navegacao responsiva (mobile)

### Admin
- [ ] Login admin
- [ ] Dashboard -> Produtos -> Criar/Editar/Excluir
- [ ] Pedidos -> Visualizar/Atualizar status
- [ ] Clientes -> Visualizar/Editar
- [ ] Agendamentos -> Calendario/Atualizar
- [ ] Servicos -> Galeria/Criar
- [ ] Configuracoes -> Salvar

### API
- [ ] Autenticacao admin
- [ ] Autenticacao cliente
- [ ] CRUD produtos
- [ ] Checkout WhatsApp
- [ ] Checkout Stripe (se configurado)

## Criterio de Aceite
- Todos os comandos passam
- Todos os testes manuais passam
- Zero regressoes funcionais
- Performance mantida ou melhorada

## Dependencias
- F4-T1, F4-T2, F4-T3 (todas as tasks anteriores da Fase 4)

## Pode Rodar em Paralelo Com
- F4-T5 (checklist release)

## Notas
- Esta e a validacao final antes do release
- Documentar qualquer issue encontrado

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
