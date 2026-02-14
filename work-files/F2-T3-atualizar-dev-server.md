# F2-T3 - Atualizar Integracao Dev Server

## Metadata
- **ID**: F2-T3
- **Fase**: 2 - Migracao do Frontend
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Atualizar arquivos que integram com o dev server Vite para usar novos paths.

## Checklist
- [ ] Atualizar `server/vite.ts` (caminho para index.html)
- [ ] Atualizar `vite-plugin-meta-images.ts` (caminho para public)
- [ ] Validar `npm run dev` funcionando

## Arquivos a Modificar

### server/vite.ts
```typescript
// Antes
const clientTemplate = path.resolve(
  import.meta.dirname,
  "..",
  "client",
  "index.html",
);

// Depois
const clientTemplate = path.resolve(
  import.meta.dirname,
  "..",
  "frontend",
  "index.html",
);
```

### vite-plugin-meta-images.ts
```typescript
// Antes
const publicDir = path.resolve(process.cwd(), 'client', 'public');

// Depois
const publicDir = path.resolve(process.cwd(), 'frontend', 'public');
```

## Criterio de Aceite
- Dev server inicia sem erros
- HMR funcionando
- Paginas carregam corretamente
- `npm run dev` funciona

## Dependencias
- F2-T1 (mover client para frontend)

## Pode Rodar em Paralelo Com
- F2-T2 (configs build)
- F2-T4 (tsconfig frontend)

## Notas
- Esta task e CRITICA para o dev workflow
- Testar navegacao entre paginas apos mudanca

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
