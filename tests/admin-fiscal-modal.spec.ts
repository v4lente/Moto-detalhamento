import { test, expect } from "@playwright/test";
import fs from "node:fs";

const source = fs.readFileSync("frontend/features/admin/pages/orders-management.tsx", "utf8");
const fiscalModal = source.slice(source.indexOf("Dados fiscais do cliente"));

test("reprodução: modal fiscal usa texto UTF-8 legível", () => {
  expect(source).toContain("Endereço");
  expect(source).not.toContain("EndereÃ§o");
});

test("regressão: valores longos da modal fiscal quebram sem colisão", () => {
  expect(fiscalModal).toContain("min-w-0");
  expect(fiscalModal).toContain("break-words");
});

