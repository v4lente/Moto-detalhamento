# F2-T5 - Reorganizar Frontend em Modulos Feature-Oriented

## Metadata
- **ID**: F2-T5
- **Fase**: 2 - Migracao do Frontend
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Reorganizar frontend em modulos por features para melhor organizacao e manutencao.

## Checklist
- [ ] Criar estrutura de diretorios por features
- [ ] Mover `main.tsx`, `App.tsx`, `index.css` para `frontend/app/`
- [ ] Mover `pages/login.tsx` para `frontend/features/auth/`
- [ ] Mover `pages/produtos.tsx`, `pages/produto.tsx` para `frontend/features/products/`
- [ ] Mover `lib/cart.tsx`, `components/checkout-dialog.tsx` para `frontend/features/cart/`
- [ ] Mover `pages/conta.tsx` para `frontend/features/account/`
- [ ] Mover `pages/agendar.tsx` para `frontend/features/scheduling/`
- [ ] Mover `pages/checkout-*.tsx` para `frontend/features/checkout/`
- [ ] Mover `pages/home.tsx` para `frontend/features/home/`
- [ ] Mover `components/ui/*` para `frontend/shared/ui/`
- [ ] Mover `components/layout.tsx` para `frontend/shared/layout/`
- [ ] Mover `lib/*` para `frontend/shared/lib/`
- [ ] Mover `hooks/*` para `frontend/shared/hooks/`
- [ ] Mover `ImageUpload.tsx`, `ObjectUploader.tsx` para `frontend/shared/components/`
- [ ] Mover `pages/not-found.tsx` para `frontend/pages/`
- [ ] Atualizar todos os imports

## Estrutura Alvo
```
frontend/
  app/
    main.tsx
    App.tsx
    index.css
  features/
    auth/
      pages/login.tsx
    admin/
      pages/           # Ver F2-T5a para decomposicao
      components/
    products/
      pages/produtos.tsx
      pages/produto.tsx
      components/product-card.tsx
    cart/
      lib/cart.tsx
      components/checkout-dialog.tsx
    account/
      pages/conta.tsx
    scheduling/
      pages/agendar.tsx
    checkout/
      pages/checkout-success.tsx
      pages/checkout-cancel.tsx
    home/
      pages/home.tsx
  shared/
    ui/               # Todos os componentes shadcn
    layout/
      layout.tsx
    lib/
      api.ts
      api-config.ts
      queryClient.ts
      utils.ts
      stripe.ts
    hooks/
      use-toast.ts
      use-mobile.tsx
      use-upload.ts
    components/
      ImageUpload.tsx
      ObjectUploader.tsx
  pages/
    not-found.tsx
```

## Criterio de Aceite
- Estrutura de diretorios criada
- Todos os arquivos movidos
- Todos os imports atualizados
- `npm run check` passa
- `npm run build` passa

## Dependencias
- F2-T1 (mover client para frontend)

## Pode Rodar em Paralelo Com
- F2-T2 (configs build) - desde que aliases estejam definidos
- F2-T5a (decomposicao admin.tsx)

## Notas
- Esta e a task mais trabalhosa da Fase 2
- Considerar fazer em sub-etapas por feature
- admin.tsx tem task separada (F2-T5a)

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
