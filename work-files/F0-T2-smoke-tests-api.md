# F0-T2 - Criar Smoke Tests de API Criticas

## Metadata
- **ID**: F0-T2
- **Fase**: 0 - Baseline e Validacao Pre-Migracao
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Criar smoke tests para APIs criticas que serao usados para validar integridade durante a migracao.

## Checklist
- [ ] Criar health check endpoint (se nao existir)
- [ ] Criar teste para GET `/api/products` (lista de produtos)
- [ ] Criar teste para GET `/api/settings` (configuracoes do site)
- [ ] Criar script `scripts/smoke-test-api.mjs`

## Arquivos a Criar
- `scripts/smoke-test-api.mjs`

## Endpoints a Testar
| Endpoint | Metodo | Esperado |
|----------|--------|----------|
| `/api/products` | GET | 200 + array |
| `/api/settings` | GET | 200 + object |
| `/api/health` | GET | 200 (criar se nao existir) |

## Criterio de Aceite
- Script de smoke test criado e funcionando
- Todos os endpoints criticos testados
- Script pode ser executado via `node scripts/smoke-test-api.mjs`

## Dependencias
- F0-T1 (baseline deve estar verde)

## Notas
- Smoke tests serao reutilizados em todas as fases para validacao

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
