import { test, expect } from "@playwright/test";
import fs from "node:fs";

const dashboard = fs.readFileSync(
  "frontend/features/admin/pages/dashboard.tsx",
  "utf8",
);

test("reprodução: Dashboard não divide total já expresso em reais", () => {
  expect(dashboard).not.toMatch(/order\.total\s*\/\s*100/);
});

test("regressão: Dashboard usa formatter BRL compartilhado", () => {
  const formatter = fs.readFileSync(
    "frontend/shared/lib/formatters.ts",
    "utf8",
  );

  expect(formatter).toContain('currency: "BRL"');
  expect(dashboard).toContain("formatCurrencyBRL(order.total)");
});
