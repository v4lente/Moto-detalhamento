# F1-T6 - Validar Desacoplamento

## Metadata
- **ID**: F1-T6
- **Fase**: 1 - Estabilizacao de Fronteiras
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Validar que o frontend esta completamente desacoplado do schema ORM e que todas as mudancas da Fase 1 estao funcionando.

## Checklist
- [ ] Verificar que frontend nao importa `drizzle-orm` (bundle analysis)
- [ ] Executar `npm run check` (TypeScript)
- [ ] Executar `npm run build` (build completo)
- [ ] Executar smoke tests criados na Fase 0
- [ ] Verificar tamanho do bundle (deve ser menor sem drizzle)

## Comandos de Validacao
```bash
# TypeScript check
npm run check

# Build completo
npm run build

# Smoke tests
node scripts/smoke-test-api.mjs

# Analise de bundle (opcional)
npx vite-bundle-visualizer
```

## Verificacoes de Bundle
- [ ] `drizzle-orm` NAO aparece no bundle do frontend
- [ ] `drizzle-zod` NAO aparece no bundle do frontend
- [ ] Apenas `zod` aparece (usado para validacao)

## Criterio de Aceite
- Todos os comandos passam
- Frontend desacoplado de ORM
- Smoke tests passando
- Bundle size igual ou menor

## Dependencias
- F1-T4 (migrar imports)
- F1-T5 (centralizar API)

## Bloqueia
- Fase 2 inteira (nao iniciar Fase 2 sem esta validacao)

## Notas
- Esta task e o checkpoint da Fase 1
- Se falhar, corrigir antes de prosseguir

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
