import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { storeDocument } from "../backend/services/customer-document.service";

const profileService = fs.readFileSync("backend/services/customer-profile.service.ts", "utf8");

test("reprodução: documento é normalizado antes de ser persistido em texto simples", () => {
  expect(storeDocument("529.982.247-25", "cpf")).toBe("52998224725");
  expect(storeDocument("12.345.678/0001-95", "cnpj")).toBe("12345678000195");
});

test("regressão: cadastros não gravam novo documento na coluna de ciphertext", () => {
  expect(profileService).toContain("documentPlaintext: storeDocument(normalizedDocument, data.documentType)");
  expect(profileService).not.toContain("documentCiphertext: encryptDocument");
});
