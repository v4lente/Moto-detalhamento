# F1-T3 - Split Detalhado de shared/schema.ts

## Metadata
- **ID**: F1-T3
- **Fase**: 1 - Estabilizacao de Fronteiras
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Separar `shared/schema.ts` em 3 camadas distintas para desacoplar frontend do ORM.

## Checklist
- [ ] Criar `shared/contracts/types.ts` (tipos puros)
- [ ] Criar `shared/contracts/validation.ts` (schemas Zod)
- [ ] Criar `shared/contracts/index.ts` (re-exports)
- [ ] Manter `shared/schema.ts` temporariamente para backend
- [ ] Validar que tipos estao corretos

## Arquivos a Criar

### shared/contracts/types.ts
Tipos TypeScript puros extraidos (SEM imports de Drizzle):
- `type User`
- `type Product`, `type ProductWithImages`
- `type ProductVariation`, `type ProductImage`
- `type SiteSettings`, `type UpdateSiteSettings`
- `type Customer`
- `type Order`, `type OrderItem`
- `type Review`
- `type ServicePost`, `type ServicePostWithMedia`
- `type Appointment`
- `type OfferedService`
- `type CheckoutData`, `type StripeCheckoutData`
- `type OrderStatus`, `type PaymentStatus`

### shared/contracts/validation.ts
Schemas Zod compartilhados (SEM dependencia de ORM):
- `checkoutSchema`
- `stripeCheckoutSchema`
- `registerCustomerSchema`
- `customerLoginSchema`
- `createAppointmentSchema`
- `updateAppointmentSchema`
- `createReviewSchema`
- `orderStatusEnum`
- `paymentStatusEnum`

### shared/contracts/index.ts
```typescript
export * from './types';
export * from './validation';
```

## Tipos a Extrair de shared/schema.ts
```typescript
// Estes tipos devem ser copiados para types.ts (sem Drizzle)
export type User = { id: string; username: string; ... }
export type Product = { id: number; name: string; ... }
// etc.
```

## Criterio de Aceite
- Arquivos criados em `shared/contracts/`
- Nenhum import de `drizzle-orm` nos contratos
- Tipos correspondem aos originais
- Backend ainda funciona com `shared/schema.ts`

## Dependencias
- F0-T1, F0-T2, F0-T3 (Fase 0 completa)

## Pode Rodar em Paralelo Com
- F1-T1 (criar estrutura)
- F1-T2 (split tsconfig)

## Bloqueia
- F1-T4 (migrar imports frontend)

## Notas
- `shared/schema.ts` sera movido para backend na Fase 3
- Frontend passara a importar de `@shared/contracts`

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
