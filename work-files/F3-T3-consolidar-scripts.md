# F3-T3 - Consolidar Diretorios de Scripts

## Metadata
- **ID**: F3-T3
- **Fase**: 3 - Migracao do Backend
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Consolidar diretorios `script/` e `scripts/` em um unico diretorio.

## Checklist
- [ ] Listar arquivos em `script/` e `scripts/`
- [ ] Decidir estrutura final
- [ ] Mover arquivos para diretorio consolidado
- [ ] Atualizar referencias em `package.json`
- [ ] Remover diretorio vazio

## Arquivos Atuais
```
script/
  build.mjs
  check-migrations.mjs
  fix-esbuild-permissions.mjs
  postbuild-db.mjs
  run-migrations.mjs
  run-seed.mjs

scripts/
  reset-db.ts
```

## Estrutura Proposta
```
scripts/
  build.mjs
  check-migrations.mjs
  fix-esbuild-permissions.mjs
  postbuild-db.mjs
  run-migrations.mjs
  run-seed.mjs
  reset-db.ts
```

## Atualizacoes em package.json
```json
// Atualizar paths de scripts que referenciam script/
"prebuild": "node scripts/check-migrations.mjs && node scripts/fix-esbuild-permissions.mjs",
"build": "node scripts/build.mjs",
"postbuild": "node --env-file-if-exists=.env scripts/postbuild-db.mjs",
```

## Criterio de Aceite
- Todos os scripts em um unico diretorio
- `package.json` atualizado
- Todos os scripts funcionando
- Diretorio vazio removido

## Dependencias
- F3-T1, F3-T2 (mover server e db)

## Pode Rodar em Paralelo Com
- F3-T4 (atualizar configs)

## Notas
- Manter scripts de build no root (nao mover para backend)

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
