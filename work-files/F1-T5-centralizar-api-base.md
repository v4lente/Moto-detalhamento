# F1-T5 - Centralizar Configuracao de API Base

## Metadata
- **ID**: F1-T5
- **Fase**: 1 - Estabilizacao de Fronteiras
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Centralizar configuracao de API base no frontend para facilitar mudancas de ambiente.

## Checklist
- [ ] Criar `client/src/lib/api-config.ts`
- [ ] Migrar hardcoded `/api` de `client/src/lib/api.ts`
- [ ] Migrar hardcoded `/api` de `client/src/lib/stripe.ts`
- [ ] Migrar hardcoded `/api` de `client/src/hooks/use-upload.ts`
- [ ] Migrar hardcoded `/api` de `client/src/components/ImageUpload.tsx`
- [ ] Validar que todas as chamadas usam config centralizada

## Arquivo a Criar

### client/src/lib/api-config.ts
```typescript
export const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
}
```

## Arquivos a Modificar

### client/src/lib/api.ts
```typescript
// Antes
const API_BASE = "/api";

// Depois
import { API_BASE } from "./api-config";
```

### client/src/lib/stripe.ts
```typescript
// Antes
fetch("/api/stripe/config")
fetch("/api/checkout/create-session")

// Depois
import { apiUrl } from "./api-config";
fetch(apiUrl("/stripe/config"))
fetch(apiUrl("/checkout/create-session"))
```

### client/src/hooks/use-upload.ts
```typescript
// Antes
fetch("/api/uploads/local")

// Depois
import { apiUrl } from "./api-config";
fetch(apiUrl("/uploads/local"))
```

### client/src/components/ImageUpload.tsx
```typescript
// Antes
fetch("/api/uploads/local")

// Depois
import { apiUrl } from "@/lib/api-config";
fetch(apiUrl("/uploads/local"))
```

## Criterio de Aceite
- Arquivo `api-config.ts` criado
- Nenhum hardcoded `/api` no frontend
- Todas as chamadas usam `apiUrl()` ou `API_BASE`
- Build e dev funcionando

## Dependencias
- F0-T1, F0-T2, F0-T3 (Fase 0 completa)

## Pode Rodar em Paralelo Com
- F1-T4 (migrar imports)

## Notas
- Permite configurar API base via env var `VITE_API_BASE`
- Util para ambientes de staging/producao diferentes

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
