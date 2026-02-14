# F2-T4 - Atualizar tsconfig do Frontend

## Metadata
- **ID**: F2-T4
- **Fase**: 2 - Migracao do Frontend
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Atualizar `frontend/tsconfig.json` para usar novos paths e remover dependencia do tsconfig root.

## Checklist
- [ ] Atualizar `frontend/tsconfig.json` com paths corretos
- [ ] Verificar que `include` aponta para `src/**/*`
- [ ] Verificar que `paths` estao corretos
- [ ] Validar `npm run check`

## Arquivo a Modificar

### frontend/tsconfig.json
```json
{
  "extends": "../tsconfig.base.json",
  "include": ["src/**/*", "../shared/contracts/**/*"],
  "compilerOptions": {
    "baseUrl": ".",
    "types": ["node", "vite/client"],
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../shared/*"]
    }
  }
}
```

## Criterio de Aceite
- tsconfig atualizado
- `npm run check` passa
- Imports funcionam corretamente
- IDE reconhece paths

## Dependencias
- F2-T1 (mover client para frontend)

## Pode Rodar em Paralelo Com
- F2-T2 (configs build)
- F2-T3 (dev server)

## Notas
- Verificar que IDE (VSCode) reconhece os novos paths

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
