# F3-T8 - Definir Estrategia para Assets Estaticos

## Metadata
- **ID**: F3-T8
- **Fase**: 3 - Migracao do Backend
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Definir e implementar estrategia para servir assets estaticos (`public/uploads/` e `attached_assets/`).

## Checklist
- [ ] Decidir localizacao dos assets (root vs backend)
- [ ] Atualizar paths em `backend/api/index.ts`
- [ ] Documentar estrategia escolhida
- [ ] Validar que assets sao servidos corretamente

## Opcoes de Estrategia

### Opcao A: Manter no Root (Recomendado)
```
/public/uploads/      # Uploads de usuarios
/attached_assets/     # Assets estaticos do projeto
```
- **Pros**: Assets sao de runtime, nao codigo. Simples de gerenciar.
- **Cons**: Mistura assets com codigo no root.

### Opcao B: Mover para backend/
```
/backend/public/uploads/
/backend/assets/
```
- **Pros**: Tudo relacionado ao backend junto.
- **Cons**: Complica paths, pode quebrar referencias existentes.

## Implementacao (Opcao A)

### backend/api/index.ts
```typescript
// Manter paths usando process.cwd()
app.use("/assets", express.static(path.resolve(process.cwd(), "attached_assets")));
app.use("/uploads", express.static(path.resolve(process.cwd(), "public/uploads")));
```

## Criterio de Aceite
- Estrategia definida e documentada
- Assets servidos corretamente
- Imagens de produtos carregam
- Uploads funcionam

## Dependencias
- F3-T1 (mover server)

## Pode Rodar em Paralelo Com
- F3-T6 (split routes)

## Notas
- Recomendacao: manter no root (Opcao A)
- Assets sao de runtime, nao codigo

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
