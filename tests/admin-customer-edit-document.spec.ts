import { test, expect } from "@playwright/test";
import fs from "node:fs";

const adminPage = fs.readFileSync("frontend/features/admin/pages/customers-management.tsx", "utf8");
const documentFields = fs.readFileSync("frontend/shared/components/customer-fields.tsx", "utf8");

test("reproducao: edicao preserva documento mascarado e oferece troca explicita", () => {
  expect(adminPage).toContain("maskedDocument={editingCustomer?.documentMasked || undefined}");
  expect(documentFields).toContain("Alterar documento");
});

test("reproducao: documento protegido nao desabilita nem comprime a grade", () => {
  expect(adminPage).not.toContain("disabled={Boolean(editingCustomer?.documentMasked)}");
  expect(adminPage).toContain("grid grid-cols-1 md:grid-cols-2 gap-4");
});

test("regressao: modo de troca permite cancelar sem recuperar valor sensivel", () => {
  expect(documentFields).toContain("Cancelar");
  expect(documentFields).toContain("defaultDocument");
  expect(documentFields).not.toContain("documentMasked");
});
