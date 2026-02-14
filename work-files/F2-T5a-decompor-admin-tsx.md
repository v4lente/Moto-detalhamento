# F2-T5a - Decompor admin.tsx (142KB)

## Metadata
- **ID**: F2-T5a
- **Fase**: 2 - Migracao do Frontend
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Decompor o arquivo monolitico `admin.tsx` (142KB, ~3500 linhas) em modulos gerenciaveis.

## Checklist
- [ ] Criar `frontend/features/admin/pages/dashboard.tsx` (visao geral)
- [ ] Criar `frontend/features/admin/pages/products-management.tsx` (CRUD produtos)
- [ ] Criar `frontend/features/admin/pages/orders-management.tsx` (gestao de pedidos)
- [ ] Criar `frontend/features/admin/pages/customers-management.tsx` (gestao de clientes)
- [ ] Criar `frontend/features/admin/pages/appointments-management.tsx` (gestao de agendamentos)
- [ ] Criar `frontend/features/admin/pages/services-management.tsx` (servicos + galeria)
- [ ] Criar `frontend/features/admin/pages/settings.tsx` (configuracoes do site)
- [ ] Mover `admin-navbar.tsx` para `frontend/features/admin/components/`
- [ ] Criar `frontend/features/admin/components/admin-layout.tsx` (layout compartilhado)
- [ ] Criar `frontend/features/admin/index.tsx` (router do admin)
- [ ] Atualizar roteamento em `App.tsx`
- [ ] Remover `admin.tsx` original

## Estrutura Alvo
```
frontend/features/admin/
  index.tsx                    # Router do admin
  pages/
    dashboard.tsx              # Visao geral, metricas
    products-management.tsx    # CRUD produtos + variacoes
    orders-management.tsx      # Lista e gestao de pedidos
    customers-management.tsx   # Lista e gestao de clientes
    appointments-management.tsx # Calendario e agendamentos
    services-management.tsx    # Servicos oferecidos + galeria
    settings.tsx               # Configuracoes do site
  components/
    admin-navbar.tsx           # Navegacao lateral
    admin-layout.tsx           # Layout com navbar + content
```

## Estimativa de Linhas por Modulo
| Modulo | Linhas Estimadas |
|--------|------------------|
| dashboard.tsx | ~200 |
| products-management.tsx | ~600 |
| orders-management.tsx | ~400 |
| customers-management.tsx | ~300 |
| appointments-management.tsx | ~400 |
| services-management.tsx | ~500 |
| settings.tsx | ~300 |
| admin-layout.tsx | ~100 |
| index.tsx (router) | ~50 |

## Criterio de Aceite
- Todos os modulos criados
- Cada modulo < 700 linhas
- Funcionalidade preservada
- Navegacao entre modulos funcionando
- `admin.tsx` original removido

## Dependencias
- F2-T1 (mover client para frontend)

## Pode Rodar em Paralelo Com
- F2-T5 (reorganizar features) - podem ser feitos juntos

## Notas
- Esta e a task mais critica da Fase 2
- Requer testes manuais extensivos
- Considerar fazer em sub-etapas por modulo

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
