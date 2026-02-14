# F2-T1 - Mover client/ para frontend/

## Metadata
- **ID**: F2-T1
- **Fase**: 2 - Migracao do Frontend
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Mover o diretorio `client/` para `frontend/` com compatibilidade temporaria de imports.

## Checklist
- [ ] Copiar `client/` para `frontend/`
- [ ] Manter `client/` temporariamente como backup
- [ ] Atualizar alias `@/` em vite.config.ts
- [ ] Verificar que imports funcionam
- [ ] Remover `client/` apos validacao

## Comandos
```bash
# Copiar estrutura
cp -r client/* frontend/

# Apos validacao, remover original
rm -rf client/
```

## Estrutura Apos Movimentacao
```
frontend/
  index.html
  public/
  src/
    main.tsx
    App.tsx
    index.css
    pages/
    components/
    lib/
    hooks/
```

## Criterio de Aceite
- Todo conteudo de `client/` movido para `frontend/`
- Imports funcionando com novos paths
- `client/` removido

## Dependencias
- F1-T6 (Fase 1 completa)

## Bloqueia
- F2-T2, F2-T3, F2-T4 (configs dependem desta task)

## Notas
- Esta e a primeira task da Fase 2
- Fazer backup antes de remover `client/`

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
