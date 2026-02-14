# F1-T2 - Criar Split de TypeScript Configs

## Metadata
- **ID**: F1-T2
- **Fase**: 1 - Estabilizacao de Fronteiras
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Criar configuracoes TypeScript separadas para frontend e backend, preparando para monorepo.

## Checklist
- [ ] Criar `tsconfig.base.json` com opcoes compartilhadas
- [ ] Criar `frontend/tsconfig.json` (extends base)
- [ ] Criar `backend/tsconfig.json` (extends base)
- [ ] Manter `tsconfig.json` root como fallback durante migracao
- [ ] Validar compilacao com `npm run check`

## Arquivos a Criar

### tsconfig.base.json
```json
{
  "compilerOptions": {
    "incremental": true,
    "noEmit": true,
    "module": "ESNext",
    "strict": true,
    "lib": ["esnext", "dom", "dom.iterable"],
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "moduleResolution": "bundler",
    "types": ["node"]
  }
}
```

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

### backend/tsconfig.json
```json
{
  "extends": "../tsconfig.base.json",
  "include": ["**/*", "../shared/**/*"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  }
}
```

## Criterio de Aceite
- Todos os arquivos tsconfig criados
- `npm run check` passa sem erros
- Compilacao funciona em todos os workspaces

## Dependencias
- F0-T1, F0-T2, F0-T3 (Fase 0 completa)

## Pode Rodar em Paralelo Com
- F1-T1 (criar estrutura)
- F1-T3 (split schema)

## Notas
- tsconfig.json root sera removido na Fase 4

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
