# F1-T1 - Criar Estrutura Inicial de Diretorios

## Metadata
- **ID**: F1-T1
- **Fase**: 1 - Estabilizacao de Fronteiras
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Criar estrutura inicial de diretorios para a nova arquitetura modular sem mover codigo de imediato.

## Checklist
- [ ] Criar diretorio `frontend/`
- [ ] Criar diretorio `backend/`
- [ ] Criar diretorio `shared/contracts/`
- [ ] Criar arquivos `.gitkeep` em cada diretorio

## Comandos
```bash
mkdir frontend
mkdir backend
mkdir shared/contracts
touch frontend/.gitkeep
touch backend/.gitkeep
touch shared/contracts/.gitkeep
```

## Estrutura Alvo
```
frontend/           # Sera populado na Fase 2
backend/            # Sera populado na Fase 3
shared/
  contracts/        # Sera populado na F1-T3
  schema.ts         # Existente, sera movido depois
```

## Criterio de Aceite
- Diretorios criados
- Estrutura visivel no repositorio
- Nenhum codigo movido ainda

## Dependencias
- F0-T1, F0-T2, F0-T3 (Fase 0 completa)

## Pode Rodar em Paralelo Com
- F1-T2 (split tsconfig)
- F1-T3 (split schema)

## Notas
- Esta task apenas cria a estrutura, nao move codigo
- Codigo sera movido nas fases subsequentes

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
