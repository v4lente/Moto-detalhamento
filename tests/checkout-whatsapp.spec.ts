import { test, expect } from "@playwright/test";
import { buildWhatsAppShare } from "../backend/services/checkout.service";
test("WhatsApp inclui nome do cliente, referência e instrução de pagamento", () => {
  const url = buildWhatsAppShare("DV-ABC123", "55 (11) 98888-7777", "David");
  const message = new URL(url).searchParams.get("text");

  expect(url).toContain("5511988887777");
  expect(message).toBe("Olá, sou o David, acabei de realizar o pedido DV-ABC123, fico aguardo para combinarmos o pagamento, obrigado!");
});
