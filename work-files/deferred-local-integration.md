# Integração local adiada (não enviar até decisão explícita)

Documentação das diferenças entre o repositório local e `origin/main` que **não** devem ser enviadas junto com entregas pontuais (ex.: mensagem pós-pedido WhatsApp).

## Estado local vs remoto

| Camada | Descrição | No remoto? |
|--------|-----------|------------|
| `origin/main` | Baseline publicada | Sim |
| Commits locais em `main` | Ver abaixo | Não |
| Working tree / WIP | Ver abaixo | Não |

### Commits locais à frente de `origin/main`

1. **`658bdff`** — feat(env): Resend, Vitest, CI, Docker, checkout server-side, RBAC `requireWriteAccess`, seed/export, ~274 uploads em `public/uploads/`, skills `.cursor/`, etc.
2. **`cf76df4`** — feat(dashboard): formatação de telefone e total no dashboard; ajustes no checkout dialog.

Recuperação: branch de backup `backup/local-main-ahead` apontando para `cf76df4` (criada durante a entrega da confirmação WhatsApp).

### WIP não commitado (antes do stash)

- `.specs/features/whatsapp-phone-capture/` — spec, design, tasks, validation
- `backend/infrastructure/payments/whatsapp.service.ts`
- Alterações em `checkout.service.ts`, `orders.routes.ts`, `storage.ts`, `api/index.ts`, `.env.example`
- `tests/unit/checkout-whatsapp.test.ts`, `tests/unit/whatsapp-webhook.test.ts`
- Ajustes em `tests/checkout-whatsapp.spec.ts`, `.context/docs/README.md`

Recuperação: `git stash list` — entrada `WIP: whatsapp-phone-capture and local changes`.

## Riscos ao integrar tudo de uma vez

| Área | Risco |
|------|--------|
| Checkout | Preços resolvidos no servidor; telefone opcional no WhatsApp; carrinho `cart-v2` |
| RBAC | Role `viewer` perde mutações (403) |
| Repositório | Centenas de JPGs + `seed-data.json` grande no histórico |
| CI | Primeiro push pode falhar E2E se env incompleto |
| WhatsApp Cloud (WIP) | Webhook público, secrets Meta, match frágil `#(\d+)` na mensagem |

## Quando integrar

- Revisar este arquivo e rodar `npm run build && npm run test:unit && npm run test`
- Decidir se uploads/seed entram no PR ou são removidos do histórico
- Configurar `RESEND_*` e `WHATSAPP_*` em produção só se as features forem ativadas
- **Não** fazer push desses itens até decisão explícita do time

## Entrega isolada (fora deste escopo)

Branch `feat/whatsapp-order-confirmation` a partir de `origin/main`: apenas tela de confirmação pós-pedido WhatsApp no site, sem os commits acima.
