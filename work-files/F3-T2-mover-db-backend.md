# F3-T2 - Mover db/ para backend/infrastructure/db/

## Metadata
- **ID**: F3-T2
- **Fase**: 3 - Migracao do Backend
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Mover o diretorio `db/` para `backend/infrastructure/db/` e ajustar paths de migrations.

## Checklist
- [ ] Criar estrutura `backend/infrastructure/db/`
- [ ] Mover `db/index.ts` -> `backend/infrastructure/db/index.ts`
- [ ] Mover `db/migrate.ts` -> `backend/infrastructure/db/migrate.ts`
- [ ] Mover `db/seed.ts` -> `backend/infrastructure/db/seed.ts`
- [ ] Ajustar paths de migrations (dev vs prod)
- [ ] Atualizar imports em outros arquivos
- [ ] Remover `db/` apos validacao

## Estrutura Alvo
```
backend/
  infrastructure/
    db/
      index.ts        # Pool + Drizzle instance
      migrate.ts      # Migration runner
      seed.ts         # Seed script
```

## Paths de Migrations
```typescript
// Em backend/infrastructure/db/index.ts
const isProduction = process.env.NODE_ENV === "production";
const migrationsPath = isProduction 
  ? path.join(__dirname, "migrations")       // dist/migrations/
  : path.join(__dirname, "..", "..", "..", "migrations"); // ../../../migrations/
```

## Criterio de Aceite
- Todos os arquivos movidos
- Paths de migrations corretos
- `npm run db:migrate` funciona
- `db/` removido

## Dependencias
- F2-T6 (Fase 2 completa)

## Pode Rodar em Paralelo Com
- F3-T1 (mover server)

## Notas
- Migrations continuam em `migrations/` no root
- Apenas codigo de DB move para backend

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
