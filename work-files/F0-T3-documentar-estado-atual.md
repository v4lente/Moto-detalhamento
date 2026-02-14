# F0-T3 - Documentar Estado Atual

## Metadata
- **ID**: F0-T3
- **Fase**: 0 - Baseline e Validacao Pre-Migracao
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Documentar estado atual do codebase para referencia durante a migracao.

## Checklist
- [ ] Mapear todos os imports de `@shared/schema` no frontend
- [ ] Listar arquivos que referenciam paths hardcoded (`/api`, `client/`, `server/`)
- [ ] Registrar tamanho e complexidade de arquivos criticos
- [ ] Criar documento de baseline em `work-files/baseline-estado-atual.md`

## Arquivos Criticos a Documentar
| Arquivo | Linhas | Complexidade |
|---------|--------|--------------|
| `client/src/pages/admin.tsx` | ~3500 | Alta |
| `server/routes.ts` | ~1580 | Alta |
| `shared/schema.ts` | ~430 | Media |

## Imports a Mapear
Arquivos que importam de `@shared/schema`:
- `client/src/lib/api.ts`
- `client/src/lib/cart.tsx`
- `client/src/pages/home.tsx`
- `client/src/pages/admin.tsx`
- `client/src/pages/produto.tsx`
- `client/src/pages/produtos.tsx`
- `client/src/pages/conta.tsx`
- `client/src/components/product-card.tsx`

## Criterio de Aceite
- Documento de baseline criado
- Todos os imports mapeados
- Tamanhos de arquivos registrados

## Dependencias
- F0-T1, F0-T2

## Notas
- Este documento sera usado como referencia durante toda a migracao

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
