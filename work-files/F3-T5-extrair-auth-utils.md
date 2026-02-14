# F3-T5 - Extrair Funcoes Utilitarias de Autenticacao

## Metadata
- **ID**: F3-T5
- **Fase**: 3 - Migracao do Backend
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Extrair funcoes utilitarias de autenticacao de `routes.ts` para modulo separado.

## Checklist
- [ ] Criar `backend/services/auth.service.ts`
- [ ] Mover `hashPassword()` de routes.ts
- [ ] Mover `comparePasswords()` de routes.ts
- [ ] Mover `shouldRehashPassword()` de routes.ts
- [ ] Atualizar imports em routes.ts
- [ ] Validar que autenticacao funciona

## Arquivo a Criar

### backend/services/auth.service.ts
```typescript
import { scrypt, randomBytes, createHash, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  // ... implementacao existente
}

export function shouldRehashPassword(stored: string): boolean {
  // ... implementacao existente
}
```

## Funcoes a Extrair de routes.ts
- `hashPassword()` (linhas ~21-25)
- `comparePasswords()` (linhas ~27-73)
- `shouldRehashPassword()` (linhas ~75-82)

## Criterio de Aceite
- Arquivo `auth.service.ts` criado
- Funcoes extraidas e funcionando
- routes.ts importa de auth.service
- Login admin e customer funcionando

## Dependencias
- F2-T6 (Fase 2 completa)

## Pode Rodar em Paralelo Com
- F3-T1 (mover server)

## Bloqueia
- F3-T6 (split routes - facilita o split)

## Notas
- Esta extracao facilita o split de routes na F3-T6
- Testar login apos extracao

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
