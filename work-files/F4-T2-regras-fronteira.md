# F4-T2 - Aplicar Regras de Fronteira de Modulo

## Metadata
- **ID**: F4-T2
- **Fase**: 4 - Limpeza e Hardening
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Aplicar e validar regras de fronteira entre frontend e backend.

## Checklist
- [ ] Verificar que frontend nao importa de `backend/`
- [ ] Verificar que backend nao importa de `frontend/`
- [ ] Validar com `tsc --noEmit` em cada workspace
- [ ] Criar ESLint rules se necessario
- [ ] Documentar regras de fronteira

## Regras de Fronteira

### Frontend pode importar de:
- `frontend/**/*` (proprio codigo)
- `shared/contracts/**/*` (tipos e validacoes)
- `node_modules/**/*` (dependencias)

### Frontend NAO pode importar de:
- `backend/**/*`
- `shared/schema.ts` (ORM)

### Backend pode importar de:
- `backend/**/*` (proprio codigo)
- `shared/**/*` (schema e contracts)
- `node_modules/**/*` (dependencias)

### Backend NAO pode importar de:
- `frontend/**/*` (exceto dev-server integration)

## Validacao
```bash
# Verificar imports no frontend
cd frontend && npx tsc --noEmit

# Verificar imports no backend
cd backend && npx tsc --noEmit
```

## ESLint Rules (Opcional)
```javascript
// .eslintrc.js
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['**/backend/**'], message: 'Frontend nao pode importar de backend' }
      ]
    }]
  }
}
```

## Criterio de Aceite
- Nenhum import cruzado invalido
- Compilacao passa em ambos workspaces
- Regras documentadas

## Dependencias
- F4-T1 (remover legado)

## Pode Rodar em Paralelo Com
- F4-T3 (documentacao)

## Notas
- ESLint rules sao opcionais mas recomendadas para enforcement

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
