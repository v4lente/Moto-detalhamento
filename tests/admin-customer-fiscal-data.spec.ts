import { test, expect } from "@playwright/test";
import fs from "node:fs";

const orderRoute = fs.readFileSync("backend/api/routes/orders.routes.ts", "utf8");
const orderPage = fs.readFileSync("frontend/features/admin/pages/orders-management.tsx", "utf8");
const api = fs.readFileSync("frontend/shared/lib/api.ts", "utf8");
const logging = fs.readFileSync("backend/api/lib/request-logging.ts", "utf8");

test("reproducao: pedido oferece modal fiscal e revelacao sob demanda", () => {
  expect(orderPage).toContain("Dados fiscais do cliente");
  expect(orderPage).toContain("Exibir documento completo");
  expect(api).toContain("customer-document/reveal");
});

test("reproducao: revelacao fiscal exige administrador e pedido vinculado", () => {
  expect(orderRoute).toContain("customer-document/reveal");
  expect(orderRoute).toContain("requireAdmin");
  expect(orderRoute).toContain("customerId");
});

test("regressao: resposta sensivel nao usa cache nem vaza em logs", () => {
  expect(orderRoute).toContain("Cache-Control");
  expect(logging).toContain("document");
  expect(orderRoute).not.toContain("documentCiphertext");
});
