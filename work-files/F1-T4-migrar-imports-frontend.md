# F1-T4 - Migrar Imports do Frontend

## Metadata
- **ID**: F1-T4
- **Fase**: 1 - Estabilizacao de Fronteiras
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Migrar todos os imports do frontend de `@shared/schema` para `@shared/contracts`.

## Checklist
- [ ] Atualizar `client/src/lib/api.ts`
- [ ] Atualizar `client/src/lib/cart.tsx`
- [ ] Atualizar `client/src/pages/home.tsx`
- [ ] Atualizar `client/src/pages/admin.tsx`
- [ ] Atualizar `client/src/pages/produto.tsx`
- [ ] Atualizar `client/src/pages/produtos.tsx`
- [ ] Atualizar `client/src/pages/conta.tsx`
- [ ] Atualizar `client/src/components/product-card.tsx`
- [ ] Validar compilacao com `npm run check`

## Mudancas de Import

### Antes
```typescript
import { Product, Order, Customer } from "@shared/schema";
```

### Depois
```typescript
import { Product, Order, Customer } from "@shared/contracts";
// ou
import type { Product, Order, Customer } from "@shared/contracts/types";
import { checkoutSchema } from "@shared/contracts/validation";
```

## Arquivos a Modificar
| Arquivo | Imports Atuais |
|---------|----------------|
| `client/src/lib/api.ts` | Product, ProductWithImages, ProductVariation, SiteSettings, etc. |
| `client/src/lib/cart.tsx` | Product, ProductVariation |
| `client/src/pages/home.tsx` | ServicePostWithMedia, OfferedService |
| `client/src/pages/admin.tsx` | ProductWithImages, ProductVariation, UpdateSiteSettings, etc. |
| `client/src/pages/produto.tsx` | ProductVariation |
| `client/src/pages/produtos.tsx` | ProductVariation |
| `client/src/pages/conta.tsx` | Order, OrderItem |
| `client/src/components/product-card.tsx` | ProductWithImages |

## Criterio de Aceite
- Todos os imports migrados
- `npm run check` passa
- `npm run build` passa
- Frontend nao importa mais de `@shared/schema`

## Dependencias
- F1-T3 (split schema deve estar completo)

## Pode Rodar em Paralelo Com
- F1-T5 (centralizar API base)

## Notas
- Usar `import type` quando possivel para melhor tree-shaking

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
