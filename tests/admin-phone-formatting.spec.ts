import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { formatPhoneBR } from "../frontend/shared/lib/formatters";

const dashboard = fs.readFileSync("frontend/features/admin/pages/dashboard.tsx", "utf8");
const orders = fs.readFileSync("frontend/features/admin/pages/orders-management.tsx", "utf8");
const appointments = fs.readFileSync("frontend/features/admin/pages/appointments-management.tsx", "utf8");

test("reprodução: Dashboard formata o telefone do pedido", () => {
  expect(dashboard).toContain("formatPhoneBR(selectedOrder.customerPhone)");
});

test("reprodução: detalhes de pedidos formatam o telefone", () => {
  expect(orders).toContain("formatPhoneBR(selectedOrder.customerPhone)");
});

test("reprodução: cards e detalhe de agendamento formatam o telefone", () => {
  expect(appointments).toContain("formatPhoneBR(appointment.customerPhone)");
  expect(dashboard).toContain("formatPhoneBR(editingAppointment.customerPhone)");
});

test("regressão: máscara visual preserva integração WhatsApp normalizada", () => {
  expect(formatPhoneBR("11988887777")).toBe("(11) 98888-7777");
  expect(formatPhoneBR("(11) 98888-7777")).toBe("(11) 98888-7777");
  expect(appointments).toContain("replace(/\\D/g, '')");
});
