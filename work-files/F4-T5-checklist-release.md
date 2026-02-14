# F4-T5 - Preparar Checklist de Release e Rollback

## Metadata
- **ID**: F4-T5
- **Fase**: 4 - Limpeza e Hardening
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Preparar documentacao de release e plano de rollback.

## Checklist
- [ ] Documentar passos de deploy
- [ ] Criar plano de rollback
- [ ] Criar checklist de validacao pos-deploy
- [ ] Documentar breaking changes (se houver)

## Documento de Release

### Pre-Deploy
- [ ] Backup do banco de dados
- [ ] Backup dos arquivos de upload
- [ ] Tag da versao anterior no git
- [ ] Notificar equipe sobre deploy

### Deploy
- [ ] Pull da branch principal
- [ ] `npm install`
- [ ] `npm run build`
- [ ] `npm run db:migrate`
- [ ] Restart do servidor
- [ ] Verificar logs de inicializacao

### Pos-Deploy
- [ ] Verificar health check
- [ ] Testar login admin
- [ ] Testar login cliente
- [ ] Verificar listagem de produtos
- [ ] Verificar upload de imagens
- [ ] Monitorar logs por 30 minutos

## Plano de Rollback

### Se algo der errado:
1. Identificar o problema nos logs
2. Se critico: reverter para tag anterior
   ```bash
   git checkout <tag-anterior>
   npm install
   npm run build
   # Restart servidor
   ```
3. Se for problema de DB: restaurar backup
4. Notificar equipe sobre rollback

### Pontos de Nao-Retorno
- Migrations de banco (requer restore de backup)
- Mudancas em dados de producao

## Criterio de Aceite
- Documentacao de release criada
- Plano de rollback documentado
- Checklist de validacao criado
- Equipe ciente do processo

## Dependencias
- F4-T4 (regressao final)

## Pode Rodar em Paralelo Com
- F4-T4 (regressao final)

## Notas
- Este documento deve ser revisado antes de cada deploy
- Manter atualizado com mudancas futuras

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
