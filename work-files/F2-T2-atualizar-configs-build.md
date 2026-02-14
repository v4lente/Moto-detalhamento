# F2-T2 - Atualizar Configs de Build e Tooling

## Metadata
- **ID**: F2-T2
- **Fase**: 2 - Migracao do Frontend
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Atualizar arquivos de configuracao de build para usar novo caminho `frontend/`.

## Checklist
- [ ] Atualizar `vite.config.ts` (root, alias, outDir)
- [ ] Atualizar `components.json` (css path, aliases)
- [ ] Verificar `postcss.config.js` (paths se necessario)
- [ ] Validar `npm run build`

## Arquivos a Modificar

### vite.config.ts
```typescript
// Antes
root: path.resolve(import.meta.dirname, "client"),
"@": path.resolve(import.meta.dirname, "client", "src"),

// Depois
root: path.resolve(import.meta.dirname, "frontend"),
"@": path.resolve(import.meta.dirname, "frontend", "src"),
```

### components.json
```json
// Antes
{
  "tailwind": {
    "css": "client/src/index.css"
  },
  "aliases": {
    "components": "@/components"
  }
}

// Depois
{
  "tailwind": {
    "css": "frontend/src/index.css"
  },
  "aliases": {
    "components": "@/components"
  }
}
```

## Criterio de Aceite
- Todos os configs atualizados
- `npm run build` passa
- Output em `dist/public` correto
- shadcn CLI funciona com novos paths

## Dependencias
- F2-T1 (mover client para frontend)

## Pode Rodar em Paralelo Com
- F2-T3 (dev server)
- F2-T4 (tsconfig frontend)

## Notas
- Testar shadcn CLI apos mudanca: `npx shadcn@latest add button`

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
