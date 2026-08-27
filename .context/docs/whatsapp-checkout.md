# Checkout por WhatsApp

O checkout público por WhatsApp é concluído no cliente, sem chamada ao endpoint
`POST /api/checkout`. Como o navegador não consegue consultar se uma mensagem foi
realmente enviada dentro do WhatsApp, a jornada usa uma confirmação explícita do
cliente antes de comunicar sucesso.

## Jornada

1. O cliente informa o nome e, se desejar, o endereço para entrega.
2. O site abre uma nova janela do WhatsApp com cliente, endereço, itens e total já
   preenchidos.
3. O site mantém o carrinho e orienta o cliente a enviar a mensagem.
4. Ao selecionar **Já enviei a mensagem**, o carrinho é limpo e o feedback completo
   de pedido realizado é exibido.
5. Se necessário, **Abrir WhatsApp novamente** reutiliza a mesma mensagem.

O endereço é sempre opcional. Clientes autenticados recebem o endereço cadastrado
pré-preenchido, mas podem editá-lo ou removê-lo para esse pedido.

## Decisão de UX

O feedback “Pedido realizado com sucesso” não é mostrado ao apenas abrir o
WhatsApp, pois isso ainda não significa que a mensagem foi enviada. A confirmação
manual é o ponto mais próximo do envio real disponível em um deep link, evita um
sucesso enganoso e impede que o carrinho seja apagado prematuramente.

## Cobertura

O cenário E2E está em `tests/checkout-whatsapp.spec.ts` e valida o endereço
opcional, o conteúdo da mensagem, a ausência de chamada ao checkout backend, a
preservação do carrinho e o feedback final.

## Evidências visuais

- [Checkout com endereço opcional](../artifacts/checkout-whatsapp-address.png)
- [Feedback final de sucesso](../artifacts/checkout-whatsapp-success.png)
- [Verificação automatizada](../artifacts/checkout-whatsapp-verification.md)
