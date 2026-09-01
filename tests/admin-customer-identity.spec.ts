import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { adminCreateCustomerSchema } from "../shared/schema";
import { formatPhoneBR } from "../frontend/shared/lib/formatters";

const adminPage = fs.readFileSync("frontend/features/admin/pages/customers-management.tsx", "utf8");
const formatter = fs.readFileSync("frontend/shared/lib/formatters.ts", "utf8");
const adminRoute = fs.readFileSync("backend/api/routes/customers.routes.ts", "utf8");
const validation = fs.readFileSync("shared/contracts/validation.ts", "utf8");

const address = {
  street: "Rua das Flores",
  number: "100",
  complement: "Sala 2",
  neighborhood: "Centro",
  city: "São Paulo",
  state: "SP",
  postalCode: "01000-000",
};

const validCpfPayload = {
  name: "Cliente Administrativo",
  phone: "(11) 98888-7777",
  email: "admin-customer@example.test",
  nickname: "Cliente",
  documentType: "cpf" as const,
  document: "52998224725",
  address,
  password: "senha-segura",
};

test("reprodução: o contrato administrativo preserva tipo e documento CPF", () => {
  const result = adminCreateCustomerSchema.safeParse(validCpfPayload);
  expect(result.success).toBeTruthy();
  if (result.success) {
    expect(result.data.documentType).toBe("cpf");
    expect(result.data.document).toBe("52998224725");
    expect(result.data.address).toEqual(address);
  }
});

test("regressão: o contrato administrativo rejeita CPF inválido", () => {
  const result = adminCreateCustomerSchema.safeParse({
    ...validCpfPayload,
    document: "00000000000",
  });
  expect(result.success).toBeFalsy();
});

test("regressão: telefone e identidade usam controles compartilhados", () => {
  expect(formatter).toContain("formatPhoneBR");
  expect(adminPage).toContain("CustomerPhoneInput");
  expect(adminPage).toContain("CustomerDocumentFields");
  expect(formatPhoneBR("11988887777")).toBe("(11) 98888-7777");
  expect(formatPhoneBR("(11) 98888-7777")).toBe("(11) 98888-7777");
});

test("regressão: rota administrativa passa pelo serviço de identidade seguro", () => {
  expect(adminRoute).toContain("createAdminCustomer");
  expect(adminRoute).toContain("updateAdminCustomer");
  expect(adminRoute).toContain("toSafeCustomerProfile");
  expect(adminRoute).not.toContain("storage.createCustomer(customerData)");
});

test("regressao: novo cliente administrativo sempre possui credenciais", () => {
  const adminCreate = validation.slice(
    validation.indexOf("export const adminCustomerCreateSchema"),
    validation.indexOf("export const adminCustomerUpdateSchema"),
  );
  expect(adminCreate).not.toContain("password: z.string().min(6).max(128).optional()");
  expect(adminCreate).toContain("password: z.string().min(8).max(128)");
});
