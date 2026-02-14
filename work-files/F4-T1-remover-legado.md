# F4-T1 - Remover Compatibilidade Legada

## Metadata
- **ID**: F4-T1
- **Fase**: 4 - Limpeza e Hardening
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Remover aliases, paths e arquivos de compatibilidade temporaria usados durante a migracao.

## Checklist
- [ ] Remover aliases antigos de `tsconfig.json` root
- [ ] Remover aliases antigos de `vite.config.ts`
- [ ] Remover `shared/schema.ts` (se ainda existir)
- [ ] Remover imports de fallback temporarios
- [ ] Remover `tsconfig.json` root (usar apenas workspace configs)
- [ ] Validar compilacao

## Arquivos a Limpar/Remover
- `tsconfig.json` (root) - remover ou simplificar
- `shared/schema.ts` - remover (substituido por contracts + backend schema)
- Aliases de compatibilidade em configs

## Criterio de Aceite
- Nenhum arquivo de compatibilidade restante
- Apenas estrutura final presente
- `npm run check` passa
- `npm run build` passa

## Dependencias
- F2-T6 (Fase 2 completa)
- F3-T9 (Fase 3 completa)

## Pode Rodar em Paralelo Com
- F4-T2 (regras de fronteira)
- F4-T3 (documentacao)

## Notas
- Fazer backup antes de remover arquivos
- Testar cada remocao individualmente

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
