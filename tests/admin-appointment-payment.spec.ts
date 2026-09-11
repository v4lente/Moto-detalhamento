import { expect, test } from "@playwright/test";
import fs from "node:fs";

const agendaPath = "frontend/features/admin/pages/appointments-management.tsx";

test.describe("interface de pagamento da agenda", () => {
  test("expõe o fluxo de conclusão e a linha pendente", () => {
    const agenda = fs.readFileSync(agendaPath, "utf8");
    expect(agenda).toContain("paymentStatus");
    expect(agenda).toContain("NÃO PAGO");
    expect(agenda).toContain("concluido");
    expect(agenda).toContain("payment-status");
  });

  test("mantém o destaque fora do calendário e dos cards", () => {
    const agenda = fs.readFileSync(agendaPath, "utf8");
    expect(agenda).toContain("appointment-row-");
    expect(agenda).toContain("paymentStatus === \"nao_pago\"");
    expect(agenda).not.toContain("calendar-payment-status");
    expect(agenda).not.toContain("appointment-card-payment-status");
  });

  test("cobre a transição, o cancelamento e a correção posterior sem reabrir", () => {
    const agenda = fs.readFileSync(agendaPath, "utf8");
    expect(agenda).toContain("handleStatusChange");
    expect(agenda).toContain("setPaymentPromptOpen(true)");
    expect(agenda).toContain("data-testid=\"button-completion-paid\"");
    expect(agenda).toContain("data-testid=\"button-completion-not-paid\"");
    expect(agenda).toContain("data-testid=\"button-cancel-completion-payment\"");
    expect(agenda).toContain("data-testid=\"select-appointment-payment-status\"");
    expect(agenda).toContain("setStatus(\"concluido\")");
    expect(agenda).toContain("value={paymentStatus}");
    expect(agenda).toContain("data-payment-status={appointment.paymentStatus}");
  });
});
