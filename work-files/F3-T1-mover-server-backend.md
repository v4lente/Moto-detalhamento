# F3-T1 - Mover server/ para backend/api/

## Metadata
- **ID**: F3-T1
- **Fase**: 3 - Migracao do Backend
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Mover o diretorio `server/` para `backend/api/` e ajustar estrutura inicial.

## Checklist
- [ ] Criar estrutura `backend/api/`
- [ ] Mover `server/index.ts` -> `backend/api/index.ts`
- [ ] Mover `server/routes.ts` -> `backend/api/routes.ts` (temporario)
- [ ] Mover `server/storage.ts` -> `backend/infrastructure/storage.ts`
- [ ] Mover `server/email.ts` -> `backend/infrastructure/email/resend.service.ts`
- [ ] Mover `server/stripe.ts` -> `backend/infrastructure/payments/stripe.service.ts`
- [ ] Mover `server/static.ts` -> `backend/api/static.ts`
- [ ] Mover `server/vite.ts` -> `backend/api/vite.ts`
- [ ] Atualizar imports internos
- [ ] Remover `server/` apos validacao

## Estrutura Alvo
```
backend/
  api/
    index.ts          # Entry point
    routes.ts         # Temporario, sera quebrado em F3-T6
    static.ts         # Serve arquivos estaticos
    vite.ts           # Dev server integration
  infrastructure/
    storage.ts        # IStorage implementation
    email/
      resend.service.ts
    payments/
      stripe.service.ts
```

## Criterio de Aceite
- Todos os arquivos movidos
- Imports atualizados
- `server/` removido
- Backend inicia sem erros

## Dependencias
- F2-T6 (Fase 2 completa)

## Pode Rodar em Paralelo Com
- F3-T2 (mover db)

## Notas
- `routes.ts` sera quebrado na task F3-T6
- Manter backup antes de remover `server/`

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
