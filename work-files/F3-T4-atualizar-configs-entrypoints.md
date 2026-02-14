# F3-T4 - Atualizar Configs e Entrypoints

## Metadata
- **ID**: F3-T4
- **Fase**: 3 - Migracao do Backend
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Atualizar arquivos de configuracao e entrypoints para usar novos paths do backend.

## Checklist
- [ ] Atualizar `scripts/build.mjs` (novo entrypoint)
- [ ] Atualizar `package.json` (scripts dev, db:*)
- [ ] Atualizar `drizzle.config.ts` (schema path)
- [ ] Validar `npm run dev`
- [ ] Validar `npm run build`

## Arquivos a Modificar

### scripts/build.mjs
```javascript
// Antes
entryPoints: [join(rootDir, "server/index.ts")],

// Depois
entryPoints: [join(rootDir, "backend/api/index.ts")],
```

### package.json
```json
// Antes
"dev": "cross-env NODE_ENV=development tsx --env-file=.env server/index.ts",
"db:migrate": "tsx --env-file=.env db/migrate.ts",

// Depois
"dev": "cross-env NODE_ENV=development tsx --env-file=.env backend/api/index.ts",
"db:migrate": "tsx --env-file=.env backend/infrastructure/db/migrate.ts",
```

### drizzle.config.ts
```typescript
// Antes
schema: "./shared/schema.ts",

// Depois (se schema moveu)
schema: "./backend/infrastructure/schema.ts",
// OU manter temporariamente
schema: "./shared/schema.ts",
```

## Criterio de Aceite
- Todos os configs atualizados
- `npm run dev` inicia o servidor
- `npm run build` gera `dist/index.js`
- `npm run db:migrate` funciona

## Dependencias
- F3-T1, F3-T2 (mover server e db)

## Pode Rodar em Paralelo Com
- F3-T3 (consolidar scripts)

## Notas
- Testar cada comando apos atualizacao

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
