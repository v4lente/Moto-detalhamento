# Verificação — checkout por WhatsApp

Data: 2026-08-27

```text
> npm run build
✓ 3647 modules transformed.
✓ Build completed successfully!

> npm run test
Running 21 tests using 6 workers
21 passed (10.1s)
```

O teste específico confirma que o endereço é opcional, integra a mensagem do
WhatsApp, mantém o carrinho antes da confirmação e exibe o feedback final após
**Já enviei a mensagem**.

Observação: a execução local não possui `DATABASE_URL`; os avisos de banco
indisponível são esperados e cobertos pelos testes de modo degradado.
