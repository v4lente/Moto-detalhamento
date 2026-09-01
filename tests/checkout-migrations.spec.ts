import { test, expect } from "@playwright/test";
import fs from "node:fs";
test("migrations de checkout são aditivas e usam decimal", () => {
  const sql = fs.readFileSync("migrations/0002_checkout_orders_expand.sql", "utf8");
  expect(sql).toContain("order_events");
  expect(sql.toLowerCase()).toContain("decimal(12,2)");
});

test("migração atual cria o campo explícito para documento em texto simples", () => {
  const sql = fs.readFileSync("migrations/0005_customer_document_plaintext.sql", "utf8");
  expect(sql).toContain("document_plaintext");
  expect(sql).toContain("ALTER TABLE `customers`");
});
