import { test, expect } from "@playwright/test";
import { customerProfileUpdateSchema } from "../shared/contracts/validation";
test("legado pode complementar documento e endereço", () => { expect(customerProfileUpdateSchema.safeParse({ documentType: "cpf", document: "52998224725", address: { street: "Rua", number: "1", neighborhood: "Centro", city: "SP", state: "SP", postalCode: "01000-000" } }).success).toBeTruthy(); });
